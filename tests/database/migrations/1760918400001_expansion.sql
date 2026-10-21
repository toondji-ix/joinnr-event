-- Up Migration
ALTER TABLE pool_lab.records ADD COLUMN revision_note_code integer;
CREATE INDEX record_membership ON pool_lab.records(event_id,membership_id);

-- Down Migration
DROP INDEX pool_lab.record_membership;
ALTER TABLE pool_lab.records DROP COLUMN revision_note_code;
