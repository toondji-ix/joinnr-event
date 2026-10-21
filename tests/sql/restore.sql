-- Snapshot data and deletion markers are synthetic, never real attendees.
DO $$ BEGIN
 IF current_database() <> 'joinnr_restore_test' THEN RAISE EXCEPTION 'Restore test DB required'; END IF;
 IF (SELECT count(*) FROM lab.records) <> 2 THEN RAISE EXCEPTION 'Snapshot incomplete'; END IF;
END $$;
-- Independent authoritative marker represents deletion AFTER the snapshot.
BEGIN;
CREATE TABLE lab.restore_deletions (user_id uuid PRIMARY KEY);
INSERT INTO lab.restore_deletions VALUES ('01900000-0000-7000-8000-000000000021');
DELETE FROM lab.records r USING lab.memberships m, lab.restore_deletions d
 WHERE r.event_id = m.event_id AND r.subject_id = m.id AND m.user_id = d.user_id;
DELETE FROM lab.memberships m USING lab.restore_deletions d WHERE m.user_id = d.user_id;
COMMIT;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM lab.memberships WHERE user_id = '01900000-0000-7000-8000-000000000021') THEN RAISE EXCEPTION 'Erased subject resurrected'; END IF;
 IF (SELECT count(*) FROM lab.records) <> 1 THEN RAISE EXCEPTION 'Purge removed wrong records'; END IF;
END $$;
SELECT 'synthetic restore and deletion replay assertions passed' AS result;
-- Repeated ledger delivery must not remove an unrelated surviving subject.
DO $$ DECLARE affected integer; BEGIN
 DELETE FROM lab.records r USING lab.memberships m, lab.restore_deletions d
  WHERE r.event_id = m.event_id AND r.subject_id = m.id AND m.user_id = d.user_id;
 GET DIAGNOSTICS affected = ROW_COUNT;
 IF affected <> 0 THEN RAISE EXCEPTION 'Repeated record purge was not idempotent'; END IF;
 DELETE FROM lab.memberships m USING lab.restore_deletions d WHERE m.user_id = d.user_id;
 GET DIAGNOSTICS affected = ROW_COUNT;
 IF affected <> 0 THEN RAISE EXCEPTION 'Repeated membership purge was not idempotent'; END IF;
 IF (SELECT count(*) FROM lab.records) <> 1 THEN RAISE EXCEPTION 'Repeated purge removed surviving records'; END IF;
END $$;
