-- Synthetic feasibility spike only; not an application migration.
DO $$ BEGIN
 IF current_database() <> 'joinnr_isolation_test' THEN RAISE EXCEPTION 'Disposable test DB required'; END IF;
END $$;
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '10s';
CREATE ROLE joinnr_lab_owner NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE joinnr_lab_runtime NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE SCHEMA lab AUTHORIZATION joinnr_lab_owner;
REVOKE ALL ON SCHEMA lab FROM PUBLIC;
GRANT USAGE ON SCHEMA lab TO joinnr_lab_runtime;
CREATE TABLE lab.memberships (
 event_id uuid NOT NULL, id uuid NOT NULL, user_id uuid NOT NULL,
 status text NOT NULL CHECK (status IN ('active', 'left')),
 PRIMARY KEY (event_id, id), UNIQUE (event_id, user_id)
);
CREATE TABLE lab.records (
 event_id uuid NOT NULL, id uuid NOT NULL, subject_id uuid NOT NULL,
 version integer NOT NULL CHECK (version > 0), PRIMARY KEY (event_id, id),
 FOREIGN KEY (event_id, subject_id) REFERENCES lab.memberships(event_id, id)
);
ALTER TABLE lab.memberships OWNER TO joinnr_lab_owner;
ALTER TABLE lab.records OWNER TO joinnr_lab_owner;
INSERT INTO lab.memberships VALUES
 ('01900000-0000-7000-8000-000000000001', '01900000-0000-7000-8000-000000000011', '01900000-0000-7000-8000-000000000021', 'active'),
 ('01900000-0000-7000-8000-000000000002', '01900000-0000-7000-8000-000000000012', '01900000-0000-7000-8000-000000000022', 'active');
INSERT INTO lab.records SELECT event_id, id, id, 1 FROM lab.memberships;
GRANT SELECT ON lab.memberships TO joinnr_lab_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON lab.records TO joinnr_lab_runtime;
ALTER TABLE lab.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE lab.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab.records FORCE ROW LEVEL SECURITY;
CREATE POLICY self_membership ON lab.memberships TO joinnr_lab_runtime
 USING (event_id = nullif(current_setting('joinnr.event_id', true), '')::uuid
 AND user_id = nullif(current_setting('joinnr.actor_id', true), '')::uuid AND status = 'active');
CREATE POLICY scoped_records ON lab.records TO joinnr_lab_runtime
 USING (EXISTS (SELECT 1 FROM lab.memberships m WHERE m.event_id = records.event_id AND m.id = records.subject_id))
 WITH CHECK (EXISTS (SELECT 1 FROM lab.memberships m WHERE m.event_id = records.event_id AND m.id = records.subject_id));
COMMIT;
-- Reuse one connection across committed and rolled-back transactions.
SET ROLE joinnr_lab_runtime;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.records) THEN RAISE EXCEPTION 'Missing context leaked rows'; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper OR rolbypassrls)) THEN RAISE EXCEPTION 'Runtime bypasses RLS'; END IF;
 IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('lab.records'::regclass, 'lab.memberships'::regclass) AND relowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)) THEN RAISE EXCEPTION 'Runtime owns tables'; END IF;
 IF has_table_privilege(current_user, 'lab.records', 'TRUNCATE') THEN RAISE EXCEPTION 'Runtime can truncate'; END IF;
END $$;
BEGIN;
SET LOCAL joinnr.event_id = '01900000-0000-7000-8000-000000000001';
SET LOCAL joinnr.actor_id = '01900000-0000-7000-8000-000000000021';
DO $$ DECLARE affected integer; BEGIN
 IF (SELECT count(*) FROM lab.records) <> 1 THEN RAISE EXCEPTION 'Own scope unavailable'; END IF;
 IF EXISTS (SELECT 1 FROM lab.records WHERE event_id = '01900000-0000-7000-8000-000000000002') THEN RAISE EXCEPTION 'Cross-event read'; END IF;
 UPDATE lab.records SET version = 2 WHERE event_id = '01900000-0000-7000-8000-000000000002';
 GET DIAGNOSTICS affected = ROW_COUNT;
 IF affected <> 0 THEN RAISE EXCEPTION 'Cross-event update'; END IF;
 DELETE FROM lab.records WHERE event_id = '01900000-0000-7000-8000-000000000002';
 GET DIAGNOSTICS affected = ROW_COUNT;
 IF affected <> 0 THEN RAISE EXCEPTION 'Cross-event delete'; END IF;
 BEGIN
  INSERT INTO lab.records VALUES ('01900000-0000-7000-8000-000000000002', '01900000-0000-7000-8000-000000000031', '01900000-0000-7000-8000-000000000012', 1);
  RAISE EXCEPTION 'Cross-event insert accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE lab.records SET version = 2 WHERE event_id = '01900000-0000-7000-8000-000000000001';
END $$;
COMMIT;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.records) THEN RAISE EXCEPTION 'Context leaked after commit'; END IF;
END $$;
BEGIN;
SET LOCAL joinnr.event_id = '01900000-0000-7000-8000-000000000002';
SET LOCAL joinnr.actor_id = '01900000-0000-7000-8000-000000000022';
DO $$ BEGIN
 IF (SELECT count(*) FROM lab.records) <> 1 THEN RAISE EXCEPTION 'Second scope unavailable'; END IF;
 UPDATE lab.records SET version = 9;
END $$;
ROLLBACK;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.records) THEN RAISE EXCEPTION 'Context leaked after rollback'; END IF;
END $$;
-- Deliberately abort a transaction, then assert the exact expected SQLSTATE.
-- Stop-on-error is restored immediately; a different failure must fail the test.
BEGIN;
SET LOCAL joinnr.event_id = '01900000-0000-7000-8000-000000000002';
SET LOCAL joinnr.actor_id = '01900000-0000-7000-8000-000000000022';
\set ON_ERROR_STOP off
SELECT 1 / 0;
\set injected_error_state :SQLSTATE
\set ON_ERROR_STOP on
ROLLBACK;
SELECT 1 / CASE WHEN :'injected_error_state' = '22012' THEN 1 ELSE 0 END;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.records) THEN RAISE EXCEPTION 'Context leaked after failed transaction'; END IF;
END $$;
BEGIN;
SET LOCAL joinnr.event_id = '01900000-0000-7000-8000-000000000002';
SET LOCAL joinnr.actor_id = '01900000-0000-7000-8000-000000000021';
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.records) THEN RAISE EXCEPTION 'Forged event scope granted access'; END IF;
END $$;
COMMIT;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT version FROM lab.records WHERE event_id = '01900000-0000-7000-8000-000000000002') <> 1 THEN RAISE EXCEPTION 'Rollback persisted mutation'; END IF;
 BEGIN
  INSERT INTO lab.records VALUES ('01900000-0000-7000-8000-000000000001', '01900000-0000-7000-8000-000000000031', '01900000-0000-7000-8000-000000000012', 1);
  RAISE EXCEPTION 'Cross-event foreign key accepted';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END $$;
UPDATE lab.memberships SET status = 'left' WHERE event_id = '01900000-0000-7000-8000-000000000001';
SET ROLE joinnr_lab_runtime;
BEGIN;
SET LOCAL joinnr.event_id = '01900000-0000-7000-8000-000000000001';
SET LOCAL joinnr.actor_id = '01900000-0000-7000-8000-000000000021';
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.records) THEN RAISE EXCEPTION 'Revoked membership retained access'; END IF;
END $$;
COMMIT;
RESET ROLE;
SELECT 'isolation assertions passed' AS result;
