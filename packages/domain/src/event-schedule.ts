/** Pure schedule rules; callers must still validate wire shapes and authorize actors. */
export interface EventSchedule {
  readonly starts_at: string;
  readonly ends_at: string;
  readonly admission_opens_at: string;
  readonly admission_closes_at: string;
  readonly networking_opens_at: string;
  readonly networking_closes_at: string;
}

export type ScheduleField = keyof EventSchedule;
export interface ScheduleIssue {
  readonly field: ScheduleField;
  readonly code: 'INVALID_UTC_INSTANT' | 'MUST_BE_AFTER' | 'MUST_NOT_BE_AFTER';
  readonly related_field?: ScheduleField;
}

const fields = [
  'starts_at',
  'ends_at',
  'admission_opens_at',
  'admission_closes_at',
  'networking_opens_at',
  'networking_closes_at',
] as const;

// Compare validated fixed-width UTC seconds and normalized decimal fractions.
// Date milliseconds alone would collapse distinct submillisecond boundaries.
export function instantKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(value);
  if (!match) return undefined;
  const seconds = match[1]!;
  const milliseconds = Date.parse(`${seconds}Z`);
  if (!Number.isFinite(milliseconds)) return undefined;
  // Reject normalized impossible dates (e.g. February 30), 24:00 and leap seconds.
  if (new Date(milliseconds).toISOString().slice(0, 19) !== seconds) return undefined;
  return `${seconds}.${(match[2] ?? '').replace(/0+$/, '')}`;
}

export function validateEventSchedule(schedule: EventSchedule): readonly ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  const keys = {} as Record<ScheduleField, string | undefined>;
  for (const field of fields) {
    keys[field] = instantKey(schedule[field]);
    if (keys[field] === undefined) issues.push({ field, code: 'INVALID_UTC_INSTANT' });
  }
  const before = (opening: ScheduleField, closing: ScheduleField) => {
    const open = keys[opening];
    const close = keys[closing];
    if (open !== undefined && close !== undefined && open >= close)
      issues.push({ field: closing, code: 'MUST_BE_AFTER', related_field: opening });
  };
  before('starts_at', 'ends_at');
  before('admission_opens_at', 'admission_closes_at');
  before('networking_opens_at', 'networking_closes_at');
  const notAfter = (earlier: ScheduleField, later: ScheduleField) => {
    const left = keys[earlier];
    const right = keys[later];
    if (left !== undefined && right !== undefined && left > right)
      issues.push({ field: earlier, code: 'MUST_NOT_BE_AFTER', related_field: later });
  };
  notAfter('admission_closes_at', 'networking_closes_at');
  notAfter('ends_at', 'networking_closes_at');
  return issues;
}

export type EventStatus = 'draft' | 'published' | 'closed' | 'cancelled' | 'archived';
export type WindowState = 'not_open' | 'open' | 'closed' | 'unavailable';
export type EventWindowAssessment =
  | {
      readonly valid: false;
      readonly issues: readonly ScheduleIssue[];
      readonly invalid_now: boolean;
    }
  | { readonly valid: true; readonly admission: WindowState; readonly networking: WindowState };

/** Supply trusted transaction time on the server. Openings inclusive; closings exclusive. */
export function assessEventWindows(
  schedule: EventSchedule,
  status: EventStatus,
  now: string,
): EventWindowAssessment {
  const issues = validateEventSchedule(schedule);
  const current = instantKey(now);
  if (issues.length || current === undefined)
    return { valid: false, issues, invalid_now: current === undefined };
  const window = (opening: string, closing: string): WindowState => {
    // This explicit allowlist fails closed for unknown runtime status values too.
    if (status !== 'published') return 'unavailable';
    if (current < instantKey(opening)!) return 'not_open';
    if (current >= instantKey(closing)!) return 'closed';
    return 'open';
  };
  return {
    valid: true,
    admission: window(schedule.admission_opens_at, schedule.admission_closes_at),
    networking: window(schedule.networking_opens_at, schedule.networking_closes_at),
  };
}
