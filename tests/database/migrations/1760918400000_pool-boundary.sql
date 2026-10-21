-- Up Migration
-- Synthetic lab only. Runtime role is created by the disposable test harness.
CREATE SCHEMA pool_lab AUTHORIZATION joinnr_pool_owner;
REVOKE ALL ON SCHEMA pool_lab FROM PUBLIC;
GRANT USAGE ON SCHEMA pool_lab TO joinnr_pool_runtime;
CREATE TABLE pool_lab.memberships (
 event_id uuid NOT NULL, id uuid NOT NULL, user_id uuid NOT NULL, active boolean NOT NULL,
 PRIMARY KEY(event_id,id), UNIQUE(event_id,user_id)
);
CREATE TABLE pool_lab.records (
 event_id uuid NOT NULL, id uuid NOT NULL, membership_id uuid NOT NULL, version integer NOT NULL CHECK(version > 0),
 PRIMARY KEY(event_id,id), FOREIGN KEY(event_id,membership_id) REFERENCES pool_lab.memberships(event_id,id)
);
CREATE TABLE pool_lab.seats (
 event_id uuid PRIMARY KEY, capacity integer NOT NULL CHECK(capacity > 0),
 admitted integer NOT NULL CHECK(admitted >= 0 AND admitted <= capacity)
);
CREATE TABLE pool_lab.admissions (
 event_id uuid NOT NULL REFERENCES pool_lab.seats(event_id), user_id uuid NOT NULL,
 PRIMARY KEY(event_id,user_id), FOREIGN KEY(event_id,user_id) REFERENCES pool_lab.memberships(event_id,user_id)
);
CREATE TABLE pool_lab.outbox (
 event_id uuid NOT NULL, user_id uuid NOT NULL,
 PRIMARY KEY(event_id,user_id), FOREIGN KEY(event_id,user_id) REFERENCES pool_lab.admissions(event_id,user_id)
);
CREATE TABLE pool_lab.requests (
 id uuid PRIMARY KEY, event_id uuid NOT NULL, member_low uuid NOT NULL, member_high uuid NOT NULL,
 sender uuid NOT NULL, status text NOT NULL CHECK(status IN ('pending','accepted')),
 CHECK(member_low < member_high), CHECK(sender IN (member_low,member_high)),
 FOREIGN KEY(event_id,member_low) REFERENCES pool_lab.memberships(event_id,id),
 FOREIGN KEY(event_id,member_high) REFERENCES pool_lab.memberships(event_id,id)
);
CREATE UNIQUE INDEX one_pending_pair ON pool_lab.requests(event_id,member_low,member_high) WHERE status='pending';
ALTER TABLE pool_lab.memberships OWNER TO joinnr_pool_owner;
ALTER TABLE pool_lab.records OWNER TO joinnr_pool_owner;
ALTER TABLE pool_lab.seats OWNER TO joinnr_pool_owner;
ALTER TABLE pool_lab.admissions OWNER TO joinnr_pool_owner;
ALTER TABLE pool_lab.outbox OWNER TO joinnr_pool_owner;
ALTER TABLE pool_lab.requests OWNER TO joinnr_pool_owner;
GRANT SELECT ON ALL TABLES IN SCHEMA pool_lab TO joinnr_pool_runtime;
GRANT INSERT,DELETE ON pool_lab.records TO joinnr_pool_runtime;
GRANT UPDATE(version) ON pool_lab.records TO joinnr_pool_runtime;
GRANT UPDATE(admitted) ON pool_lab.seats TO joinnr_pool_runtime;
GRANT INSERT ON pool_lab.admissions,pool_lab.outbox,pool_lab.requests TO joinnr_pool_runtime;
ALTER TABLE pool_lab.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_lab.memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY self_member ON pool_lab.memberships TO joinnr_pool_runtime USING (
 event_id = nullif(current_setting('joinnr.event_id',true),'')::uuid AND
 user_id = nullif(current_setting('joinnr.actor_id',true),'')::uuid AND active
);
ALTER TABLE pool_lab.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_lab.records FORCE ROW LEVEL SECURITY;
CREATE POLICY own_record ON pool_lab.records TO joinnr_pool_runtime USING (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=records.event_id AND m.id=records.membership_id)
) WITH CHECK (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=records.event_id AND m.id=records.membership_id)
);
ALTER TABLE pool_lab.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_lab.seats FORCE ROW LEVEL SECURITY;
CREATE POLICY event_seat ON pool_lab.seats TO joinnr_pool_runtime USING (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=seats.event_id)
) WITH CHECK (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=seats.event_id)
);
ALTER TABLE pool_lab.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_lab.admissions FORCE ROW LEVEL SECURITY;
CREATE POLICY own_admission ON pool_lab.admissions TO joinnr_pool_runtime USING (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=admissions.event_id AND m.user_id=admissions.user_id)
) WITH CHECK (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=admissions.event_id AND m.user_id=admissions.user_id)
);
ALTER TABLE pool_lab.outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_lab.outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY own_outbox ON pool_lab.outbox TO joinnr_pool_runtime USING (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=outbox.event_id AND m.user_id=outbox.user_id)
) WITH CHECK (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=outbox.event_id AND m.user_id=outbox.user_id)
);
ALTER TABLE pool_lab.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_lab.requests FORCE ROW LEVEL SECURITY;
CREATE POLICY pair_request ON pool_lab.requests TO joinnr_pool_runtime USING (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=requests.event_id AND m.id IN (requests.member_low,requests.member_high))
) WITH CHECK (
 EXISTS(SELECT 1 FROM pool_lab.memberships m WHERE m.event_id=requests.event_id AND m.id IN (requests.member_low,requests.member_high))
);

-- Down Migration
-- Lab-only teardown; no production down-migration command is exposed.
DROP SCHEMA pool_lab CASCADE;
