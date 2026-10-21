import { assessEventWindows, instantKey } from './event-schedule';
import type { EventSchedule, EventStatus } from './event-schedule';

export type RequestAction = 'accept' | 'decline' | 'withdraw';
export type RequestState = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'expired';

/** Server-resolved snapshot, read under the pair/request locks; never a wire input. */
export interface RequestTransitionInput {
  readonly action: RequestAction;
  readonly actor_membership_id: string;
  readonly request: {
    readonly event_id: string;
    readonly sender_membership_id: string;
    readonly receiver_membership_id: string;
    readonly status: RequestState;
    readonly version: number;
    readonly expires_at: string;
  };
  readonly event_id: string;
  readonly expected_version: number;
  /** Both live accounts/memberships, event scope and block checks already passed. */
  readonly pair_accessible: boolean;
  readonly schedule: EventSchedule;
  readonly event_status: EventStatus;
  readonly now: string;
}

export type RequestTransitionDecision =
  | {
      readonly allowed: false;
      readonly code: 'NOT_FOUND' | 'CONFLICT' | 'STALE_VERSION' | 'INVALID_SNAPSHOT';
    }
  | {
      readonly allowed: true;
      readonly next_status: 'accepted' | 'declined' | 'withdrawn';
      readonly next_version: number;
      readonly create_connection: boolean;
    };

/** Pure decision only: does not authenticate, commit, replay idempotency or grant contacts. */
export function decideRequestTransition(input: RequestTransitionInput): RequestTransitionDecision {
  const { request, action } = input;
  const participant =
    action === 'withdraw' ? request.sender_membership_id : request.receiver_membership_id;
  // Conceal inaccessible objects before returning state/version information.
  if (
    input.pair_accessible !== true ||
    input.event_id !== request.event_id ||
    input.actor_membership_id !== participant
  )
    return { allowed: false, code: 'NOT_FOUND' };
  const windows = assessEventWindows(input.schedule, input.event_status, input.now);
  const now = instantKey(input.now);
  const expiry = instantKey(request.expires_at);
  if (
    !['accept', 'decline', 'withdraw'].includes(action) ||
    !Number.isSafeInteger(request.version) ||
    request.version < 1 ||
    request.version === Number.MAX_SAFE_INTEGER ||
    !Number.isSafeInteger(input.expected_version) ||
    input.expected_version < 1 ||
    request.sender_membership_id === request.receiver_membership_id ||
    !windows.valid ||
    now === undefined ||
    expiry === undefined
  )
    return { allowed: false, code: 'INVALID_SNAPSHOT' };
  // Expiry is live, including the exact close instant; no scheduler dependency.
  if (request.status !== 'pending' || now >= expiry || windows.networking !== 'open')
    return { allowed: false, code: 'CONFLICT' };
  if (input.expected_version !== request.version) return { allowed: false, code: 'STALE_VERSION' };
  return {
    allowed: true,
    next_status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'withdrawn',
    next_version: request.version + 1,
    create_connection: action === 'accept',
  };
}
