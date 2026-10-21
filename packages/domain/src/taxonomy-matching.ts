import { assessEventWindows, instantKey } from './event-schedule';
import type { EventSchedule, EventStatus } from './event-schedule';
import type { GoalIdentity } from './profile-selections';
import { duplicateGoalIndexes } from './profile-selections';

export interface MatchingProfile {
  readonly membership_id: string;
  readonly event_id: string;
  readonly account_active: boolean;
  readonly membership_active: boolean;
  readonly networking_enabled: boolean;
  readonly profile_complete: boolean;
  readonly profile_version: number;
  readonly current_profile_version: number;
  readonly interests: readonly string[];
  readonly goals: readonly GoalIdentity[];
}

export interface GoalCompatibilityRule {
  readonly source_topic_id: string;
  readonly source_direction: 'seek' | 'offer';
  readonly target_topic_id: string;
  readonly target_direction: 'seek' | 'offer';
}

export interface MatchingCandidate {
  readonly profile: MatchingProfile;
  readonly blocked_either_direction: boolean;
  readonly pending_request: boolean;
  readonly connected_or_ended: boolean;
  readonly cooldown_active: boolean;
}

export interface TaxonomyMatchingInput {
  readonly actor: MatchingProfile;
  readonly candidates: readonly MatchingCandidate[];
  readonly event_status: EventStatus;
  readonly schedule: EventSchedule;
  readonly data_expires_at: string;
  readonly now: string;
  readonly configuration: {
    readonly algorithm_version: string;
    readonly taxonomy_version: string;
    readonly rules: readonly GoalCompatibilityRule[];
    readonly goal_weight: number;
    readonly interest_weight: number;
    readonly limit: number;
  };
}

export interface TaxonomyMatch {
  readonly membership_id: string;
  /** Internal ordering only; never a compatibility percentage or public DTO field. */
  readonly score_internal: number;
  readonly reasons: readonly (
    | { readonly code: 'SHARED_INTEREST'; readonly interest_id: string }
    | {
        readonly code: 'GOAL_FIT';
        readonly source: 'actor' | 'candidate';
        readonly source_topic_id: string;
        readonly source_direction: 'seek' | 'offer';
        readonly target_topic_id: string;
        readonly target_direction: 'seek' | 'offer';
      }
  )[];
}

/** Pure snapshot ranking. Caller resolves trusted live facts and revalidates before delivery. */
export function rankTaxonomyCandidates(input: TaxonomyMatchingInput): readonly TaxonomyMatch[] {
  const config = input.configuration;
  if (
    !config.algorithm_version.trim() ||
    !config.taxonomy_version.trim() ||
    !Number.isFinite(config.goal_weight) ||
    config.goal_weight <= 0 ||
    !Number.isFinite(config.interest_weight) ||
    config.interest_weight <= 0 ||
    !Number.isFinite(config.goal_weight + config.interest_weight) ||
    !Number.isInteger(config.limit) ||
    config.limit < 1 ||
    config.limit > 5
  )
    throw new Error('Invalid matching configuration');
  const now = instantKey(input.now);
  const expiry = instantKey(input.data_expires_at);
  const windows = assessEventWindows(input.schedule, input.event_status, input.now);
  if (
    !windows.valid ||
    windows.networking !== 'open' ||
    now === undefined ||
    expiry === undefined ||
    now >= expiry
  )
    return [];
  const eligible = (profile: MatchingProfile) =>
    profile.account_active === true &&
    profile.membership_active === true &&
    profile.networking_enabled === true &&
    profile.profile_complete === true &&
    Number.isSafeInteger(profile.profile_version) &&
    profile.profile_version > 0 &&
    profile.profile_version === profile.current_profile_version &&
    profile.interests.length >= 3 &&
    profile.interests.length <= 10 &&
    profile.goals.length >= 1 &&
    profile.goals.length <= 3 &&
    duplicateGoalIndexes(profile.goals).length === 0;
  if (!eligible(input.actor)) return [];
  const normalize = (value: string) => value.toLowerCase();
  const actorId = normalize(input.actor.membership_id);
  const eventId = normalize(input.actor.event_id);
  const actorInterests = new Set(input.actor.interests.map(normalize));
  if (actorInterests.size !== input.actor.interests.length) return [];
  const seen = new Set<string>();
  // Ambiguous duplicate snapshots fail closed; never let the first copy bypass a later denial.
  const counts = new Map<string, number>();
  for (const candidate of input.candidates) {
    const id = normalize(candidate.profile.membership_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const matches: TaxonomyMatch[] = [];
  for (const candidate of input.candidates) {
    const profile = candidate.profile;
    const id = normalize(profile.membership_id);
    if (
      id === actorId ||
      counts.get(id) !== 1 ||
      seen.has(id) ||
      normalize(profile.event_id) !== eventId ||
      !eligible(profile) ||
      candidate.blocked_either_direction !== false ||
      candidate.pending_request !== false ||
      candidate.connected_or_ended !== false ||
      candidate.cooldown_active !== false
    )
      continue;
    seen.add(id);
    const interests = new Set(profile.interests.map(normalize));
    if (interests.size !== profile.interests.length) continue;
    const shared = [...actorInterests].filter((interest) => interests.has(interest)).sort();
    const interestFit = shared.length / new Set([...actorInterests, ...interests]).size;
    const reasons: TaxonomyMatch['reasons'][number][] = shared.map((interest_id) => ({
      code: 'SHARED_INTEREST',
      interest_id,
    }));
    const direction = (
      source: MatchingProfile,
      target: MatchingProfile,
      origin: 'actor' | 'candidate',
    ) => {
      let matched = 0;
      for (const goal of source.goals) {
        const fit = target.goals.find((other) =>
          config.rules.some(
            (rule) =>
              normalize(rule.source_topic_id) === normalize(goal.topic_id) &&
              rule.source_direction === goal.direction &&
              normalize(rule.target_topic_id) === normalize(other.topic_id) &&
              rule.target_direction === other.direction,
          ),
        );
        if (fit) {
          matched++;
          reasons.push({
            code: 'GOAL_FIT',
            source: origin,
            source_topic_id: normalize(goal.topic_id),
            source_direction: goal.direction,
            target_topic_id: normalize(fit.topic_id),
            target_direction: fit.direction,
          });
        }
      }
      return matched / source.goals.length;
    };
    const forward = direction(input.actor, profile, 'actor');
    const reverse = direction(profile, input.actor, 'candidate');
    const goalFit = forward + reverse === 0 ? 0 : (2 * forward * reverse) / (forward + reverse);
    // One-way fit must not create an apparent reciprocal recommendation by itself.
    if (shared.length === 0 && goalFit === 0) continue;
    const score =
      (config.goal_weight * goalFit + config.interest_weight * interestFit) /
      (config.goal_weight + config.interest_weight);
    matches.push({ membership_id: profile.membership_id, score_internal: score, reasons });
  }
  return matches
    .sort(
      (left, right) =>
        right.score_internal - left.score_internal ||
        (normalize(left.membership_id) < normalize(right.membership_id) ? -1 : 1),
    )
    .slice(0, config.limit);
}
