/** Pure identity checks after wire validation; no taxonomy/access/consent assertion. */
export function duplicateInterestIndexes(ids: readonly string[]): readonly number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  ids.forEach((id, index) => {
    const canonical = id.toLowerCase();
    if (seen.has(canonical)) duplicates.push(index);
    seen.add(canonical);
  });
  return duplicates;
}

export interface GoalIdentity {
  readonly direction: 'seek' | 'offer';
  readonly topic_id: string;
}

export function duplicateGoalIndexes(goals: readonly GoalIdentity[]): readonly number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];
  goals.forEach((goal, index) => {
    const identity = `${goal.direction}:${goal.topic_id.toLowerCase()}`;
    if (seen.has(identity)) duplicates.push(index);
    seen.add(identity);
  });
  return duplicates;
}
