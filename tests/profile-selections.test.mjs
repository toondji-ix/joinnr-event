import assert from 'node:assert/strict';
import test from 'node:test';
import { duplicateGoalIndexes, duplicateInterestIndexes } from '../packages/domain/dist/index.js';

const topic = '01900000-0000-7000-8000-0000000000ab';
test('interest identity treats UUID letter case as the same database ID', () => {
  assert.deepEqual(duplicateInterestIndexes([topic, topic.toUpperCase(), topic]), [1, 2]);
  assert.deepEqual(duplicateInterestIndexes([topic, '01900000-0000-7000-8000-0000000000ac']), []);
});
test('goals reject repeated direction/topic identity even when content differs', () => {
  assert.deepEqual(
    duplicateGoalIndexes([
      { direction: 'offer', topic_id: topic, public_summary: 'First summary', priority: 1 },
      {
        direction: 'offer',
        topic_id: topic.toUpperCase(),
        public_summary: 'Different summary',
        priority: 2,
      },
    ]),
    [1],
  );
});
test('opposite directions for one topic and offer-only profiles remain valid', () => {
  assert.deepEqual(
    duplicateGoalIndexes([
      { direction: 'seek', topic_id: topic },
      { direction: 'offer', topic_id: topic },
    ]),
    [],
  );
  assert.deepEqual(duplicateGoalIndexes([{ direction: 'offer', topic_id: topic }]), []);
});
