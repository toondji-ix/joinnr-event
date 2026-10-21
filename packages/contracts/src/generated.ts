// Generated from ../openapi.yaml. Run pnpm contracts:generate; do not edit.
export interface paths {
  '/events/{eid}/profiles/{mid}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Read a related same-event attendee public profile
     * @description Resolve the authenticated actor and both memberships from live server records. Require active accounts, active same-event memberships, current networking eligibility, event availability and no block in either direction. Require a currently authorized recommendation, request or connection relation to the target. Recheck relation validity and expiry at read time; possession of an ID or stale recommendation never grants access. Unknown and inaccessible targets receive the same 404. Return only PublicProfile; contacts, private goal detail and assessment data are forbidden even after acceptance. No global directory or arbitrary profile lookup is introduced. Contract only; no route implemented.
     */
    get: operations['getRelatedPublicProfile'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/organizations': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create an organization and its owner membership atomically
     * @description Requires a verified account and MFA. The actor comes from validated authentication, never from the request body. Ownership is assigned by the service, not by a supplied role. Idempotent replay returns the same logical result. This contract does not implement identity or persistence.
     */
    post: operations['createOrganization'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/organizations/{oid}/events': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Create a conference draft in an owned organization
     * @description Organization ownership is checked against current server-side membership. Other staff cannot create events in the MVP. An inaccessible organization returns the same 404 as an unknown ID. Draft creation must not generate access credentials, publish an event, or enroll its creator as an attendee. The initial capacity envelope is a proposed engineering baseline, not a validated business commitment.
     */
    post: operations['createEvent'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/access/resolve': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Resolve one event credential to a safe preview and short-lived intent
     * @description Public and rate-limited. Accept exactly one credential. An invalid, expired, rotated, closed or cancelled credential receives the same generic 400. Response must not contain members, contacts, profile data or the supplied credential. Signed intent lifetime is at most 10 minutes and never exceeds credential expiry. Later enrollment revalidates credential version and event policy; this operation does not reserve capacity or grant admission.
     */
    post: operations['resolveEventAccess'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/events/{eid}/requests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Send an explicit event-scoped connection request
     * @description Eligible self only. Verify both current accounts, active same-event memberships, networking consent, live relationship, blocks, quotas and open networking window. A recommendation must belong to the sender/event/pair. Omission of recommendation_id never authorizes guessed IDs: an existing received-request relation is required instead. Canonicalize and lock the pair. An existing same-direction or crossed pending request returns 200 without auto-accepting or changing sender/receiver. New requests commit once with minimal outbox facts. No contacts are returned. All live checks remain unimplemented.
     */
    post: operations['createConnectionRequest'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/events/{eid}/requests/{rid}/accept': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Accept a pending connection request
     * @description Only the request-receiver may act. Require the request's strong If-Match version; no JSON body is accepted. Resolve event/request/memberships from current server state, conceal inaccessible IDs, and lock the canonical pair/request with a lock order compatible with block. Recheck account, membership, block, event/networking and request expiry using trusted transaction time; scheduler delay cannot extend permission. Require pending state: 409 for a terminal or expired request, 412 for a stale version after access checks. Acceptance creates one active connection and outbox fact atomically with the request transition. It creates no contact grants and returns no contact fields. Idempotent replay requires live authorization before returning safe current state. Real transaction, authorization and concurrency enforcement are future work.
     */
    post: operations['acceptConnectionRequest'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/events/{eid}/requests/{rid}/decline': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Decline a pending connection request
     * @description Only the request-receiver may act. Require the request's strong If-Match version; no JSON body is accepted. Resolve event/request/memberships from current server state, conceal inaccessible IDs, and lock the canonical pair/request with a lock order compatible with block. Recheck account, membership, block, event/networking and request expiry using trusted transaction time; scheduler delay cannot extend permission. Require pending state: 409 for a terminal or expired request, 412 for a stale version after access checks. Increment request version and commit the transition with minimal outbox facts; never modify a terminal request or restore contact access. Real transaction, authorization and concurrency enforcement are future work.
     */
    post: operations['declineConnectionRequest'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/events/{eid}/requests/{rid}/withdraw': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /**
     * Withdraw a pending connection request
     * @description Only the request-sender may act. Require the request's strong If-Match version; no JSON body is accepted. Resolve event/request/memberships from current server state, conceal inaccessible IDs, and lock the canonical pair/request with a lock order compatible with block. Recheck account, membership, block, event/networking and request expiry using trusted transaction time; scheduler delay cannot extend permission. Require pending state: 409 for a terminal or expired request, 412 for a stale version after access checks. Increment request version and commit the transition with minimal outbox facts; never modify a terminal request or restore contact access. Real transaction, authorization and concurrency enforcement are future work.
     */
    post: operations['withdrawConnectionRequest'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/events/{eid}/profile/interests': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Replace the active member's own event interests
     * @description Active self membership and an existing profile are required. The actor is derived from verified authentication; event ID alone grants nothing. Require If-Match of the current profile version. Validate all IDs against active approved taxonomy, replace the complete selection, increment profile version, invalidate derived recommendations/vectors and write minimal outbox facts in one transaction. No automatic networking or semantic consent. A stale retry gets 412 rather than silently overwriting a later edit. This specification implements no route or storage.
     */
    put: operations['replaceProfileInterests'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/events/{eid}/profile/goals': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Replace the active member's own event goals
     * @description Active self membership and an existing profile are required. Require the current profile's If-Match version. Validate active topic IDs and unique direction/topic pairs; uniqueItems alone cannot enforce the composite identity when detail differs. Offer-only profiles are valid. Replace goals, increment profile version, invalidate derived data and write minimal outbox facts atomically. Private detail is returned only to its author here, never in PublicProfile, analytics, logs or outbox. Treat all text as plain data; no raw HTML. No consent is implicitly granted. Retention and cancelled/expired-event editing remain policy-gated. No runtime implementation.
     */
    put: operations['replaceProfileGoals'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    PublicProfileEnvelope: {
      data: components['schemas']['PublicProfile'];
    };
    ProfileInterestsInput: {
      interest_ids: components['schemas']['InterestIds'];
    };
    InterestIds: components['schemas']['Uuid'][];
    GoalInput: {
      /** @enum {string} */
      direction: 'seek' | 'offer';
      topic_id: components['schemas']['Uuid'];
      public_summary: string;
      detail?: string;
      priority: number;
    };
    GoalSelection: components['schemas']['GoalInput'][];
    ProfileGoalsInput: {
      goals: components['schemas']['GoalSelection'];
    };
    ProfileInterestsEnvelope: {
      data: {
        version: components['schemas']['Version'];
        interest_ids: components['schemas']['InterestIds'];
      };
    };
    ProfileGoalsEnvelope: {
      data: {
        version: components['schemas']['Version'];
        goals: components['schemas']['GoalSelection'];
      };
    };
    /** Format: uuid */
    Uuid: string;
    /**
     * Format: date-time
     * @description RFC 3339 instant using canonical UTC Z representation.
     */
    UtcTimestamp: string;
    Version: number;
    /** @enum {string} */
    ConferenceCategory:
      'technology_conference' | 'business_conference' | 'startup_summit' | 'corporate_networking';
    /** @enum {string} */
    AdmissionMode: 'shared' | 'approval';
    /**
     * Format: iana-time-zone
     * @description Named IANA timezone accepted by the service timezone database; not a UTC offset.
     */
    TimeZone: string;
    OrganizationInput: {
      name: string;
    };
    OrganizationEnvelope: {
      data: {
        id: components['schemas']['Uuid'];
        name: string;
        version: components['schemas']['Version'];
      };
    };
    /** @description Shape validation only. Chronological comparisons, live taxonomy/policy, capacity races and membership authorization require later domain services. */
    EventInput: {
      title: string;
      description: string;
      category: components['schemas']['ConferenceCategory'];
      timezone: components['schemas']['TimeZone'];
      starts_at: components['schemas']['UtcTimestamp'];
      ends_at: components['schemas']['UtcTimestamp'];
      admission_opens_at: components['schemas']['UtcTimestamp'];
      admission_closes_at: components['schemas']['UtcTimestamp'];
      networking_opens_at: components['schemas']['UtcTimestamp'];
      networking_closes_at: components['schemas']['UtcTimestamp'];
      capacity: number;
      admission_mode: components['schemas']['AdmissionMode'];
    };
    DraftEventEnvelope: {
      data: {
        id: components['schemas']['Uuid'];
        organization_id: components['schemas']['Uuid'];
        /** @constant */
        status: 'draft';
        version: components['schemas']['Version'];
      };
    };
    AccessResolutionInput:
      | {
          link_token: string;
        }
      | {
          /** @description Canonical uppercase Crockford Base32; clients normalize code entry. */
          join_code: string;
        };
    EventSummary: {
      id: components['schemas']['Uuid'];
      organization_name: string;
      title: string;
      category: components['schemas']['ConferenceCategory'];
      timezone: components['schemas']['TimeZone'];
      starts_at: components['schemas']['UtcTimestamp'];
      ends_at: components['schemas']['UtcTimestamp'];
      admission_opens_at: components['schemas']['UtcTimestamp'];
      admission_closes_at: components['schemas']['UtcTimestamp'];
      networking_opens_at: components['schemas']['UtcTimestamp'];
      networking_closes_at: components['schemas']['UtcTimestamp'];
      admission_mode: components['schemas']['AdmissionMode'];
      /** @constant */
      status: 'published';
    };
    AccessResolutionEnvelope: {
      data: {
        event: components['schemas']['EventSummary'];
        /** @description Opaque signed intent, not an access token; never decode/trust it client-side. */
        join_intent: string;
        expires_at: components['schemas']['UtcTimestamp'];
      };
    };
    Problem: {
      /** Format: uri */
      type: string;
      title: string;
      status: number;
      code: string;
      request_id: components['schemas']['Uuid'];
      field_errors?: {
        field: string;
        code: string;
      }[];
    };
    /** @description Public event projection only. Live relation/consent and event checks precede reads. No contacts, raw style, private goals or internal user IDs. Interest labels have a technical wire bound of 160 characters; label uniqueness is not implied. */
    PublicProfile: {
      membership_id: components['schemas']['Uuid'];
      event_id: components['schemas']['Uuid'];
      display_name: string;
      headline: string;
      company?: string;
      bio?: string;
      avatar_asset_id?: components['schemas']['Uuid'];
      /** @enum {string} */
      experience_level?: 'early' | 'mid' | 'senior' | 'prefer_not';
      /** @enum {string} */
      experience_preference?: 'peer' | 'learn' | 'share' | 'any';
      interests: string[];
      goals: string[];
    };
    RequestInput: {
      target_mid: components['schemas']['Uuid'];
      recommendation_id?: components['schemas']['Uuid'];
      intro?: string;
    };
    PendingRequest: {
      id: components['schemas']['Uuid'];
      event_id: components['schemas']['Uuid'];
      sender: components['schemas']['PublicProfile'];
      receiver: components['schemas']['PublicProfile'];
      /** @constant */
      status: 'pending';
      introduction?: string;
      created_at: components['schemas']['UtcTimestamp'];
      expires_at: components['schemas']['UtcTimestamp'];
      version: components['schemas']['Version'];
    };
    DeclinedRequest: {
      id: components['schemas']['Uuid'];
      event_id: components['schemas']['Uuid'];
      sender: components['schemas']['PublicProfile'];
      receiver: components['schemas']['PublicProfile'];
      /** @constant */
      status: 'declined';
      introduction?: string;
      created_at: components['schemas']['UtcTimestamp'];
      expires_at: components['schemas']['UtcTimestamp'];
      version: components['schemas']['Version'];
    };
    WithdrawnRequest: {
      id: components['schemas']['Uuid'];
      event_id: components['schemas']['Uuid'];
      sender: components['schemas']['PublicProfile'];
      receiver: components['schemas']['PublicProfile'];
      /** @constant */
      status: 'withdrawn';
      introduction?: string;
      created_at: components['schemas']['UtcTimestamp'];
      expires_at: components['schemas']['UtcTimestamp'];
      version: components['schemas']['Version'];
    };
    Connection: {
      id: components['schemas']['Uuid'];
      event_id: components['schemas']['Uuid'];
      request_id: components['schemas']['Uuid'];
      member_low: components['schemas']['Uuid'];
      member_high: components['schemas']['Uuid'];
      /** @constant */
      status: 'active';
      connected_at: components['schemas']['UtcTimestamp'];
      version: components['schemas']['Version'];
    };
    PendingRequestEnvelope: {
      data: components['schemas']['PendingRequest'];
    };
    DeclinedRequestEnvelope: {
      data: components['schemas']['DeclinedRequest'];
    };
    WithdrawnRequestEnvelope: {
      data: components['schemas']['WithdrawnRequest'];
    };
    ConnectionEnvelope: {
      data: components['schemas']['Connection'];
    };
  };
  responses: {
    /** @description Malformed request or generic invalid/unavailable access credential. */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Missing, expired, revoked or invalid authentication. */
    Unauthorized: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Accessible resource, but required role, verification or MFA is absent. */
    Forbidden: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Resource is unknown or inaccessible; no existence disclosure. */
    NotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description State or idempotency key conflicts with the requested mutation. */
    Conflict: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Request exceeds the configured transport or body-size limit. */
    TooLarge: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Safe field errors only; do not return supplied secrets or internal errors. */
    ValidationFailed: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Request quota exceeded. */
    RateLimited: {
      headers: {
        'Retry-After': components['headers']['RetryAfter'];
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Temporary service failure; return a safe public code and request ID. */
    Unavailable: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description Conditional resource version is stale. No mutation or side effect is committed. */
    PreconditionFailed: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
    /** @description If-Match resource version is required. No mutation is committed. */
    PreconditionRequired: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/problem+json': components['schemas']['Problem'];
      };
    };
  };
  parameters: {
    /** @description Organization identifier; possession does not confer authority. */
    OrganizationId: components['schemas']['Uuid'];
    /** @description CSPRNG-generated key with at least 128 bits of entropy, scoped to actor and route for 24 hours. Syntax validation cannot prove randomness. Reuse with a different request body returns 409. */
    IdempotencyKey: string;
    /** @description Event scope; live membership and resource relationships must be checked. */
    EventId: components['schemas']['Uuid'];
    /** @description Request in the path event; inaccessible and unknown IDs return the same 404. */
    RequestId: components['schemas']['Uuid'];
    /** @description One strong quoted positive resource version, e.g. "1". Each operation identifies whether this is a request or profile version. Wildcards, weak validators and lists are not accepted. Service validates safe-integer range; 428 if missing, 412 if stale. */
    IfMatch: string;
  };
  requestBodies: never;
  headers: {
    /** @description Strong quoted version of the self event profile; not a request, connection or consent version. */
    ProfileETag: string;
    /** @description Authenticated private response; no storage by any cache. */
    PrivateNoStore: 'private, no-store';
    /** @description Do not cache credentials, private objects or their envelopes. */
    NoStore: 'no-store';
    /** @description Positive delay in seconds before retry; no automatic unlimited retry. */
    RetryAfter: number;
    /** @description Strong quoted version of the returned request or connection, not a contact grant version. */
    ETag: string;
  };
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  getRelatedPublicProfile: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
        /** @description Target membership in this event; never an authorization credential. */
        mid: components['schemas']['Uuid'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Allowlisted public profile after live authorization. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PublicProfileEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      404: components['responses']['NotFound'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  createOrganization: {
    parameters: {
      query?: never;
      header: {
        /** @description CSPRNG-generated key with at least 128 bits of entropy, scoped to actor and route for 24 hours. Syntax validation cannot prove randomness. Reuse with a different request body returns 409. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['OrganizationInput'];
      };
    };
    responses: {
      /** @description Organization and owner membership committed in one transaction. */
      201: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['OrganizationEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      409: components['responses']['Conflict'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  createEvent: {
    parameters: {
      query?: never;
      header: {
        /** @description CSPRNG-generated key with at least 128 bits of entropy, scoped to actor and route for 24 hours. Syntax validation cannot prove randomness. Reuse with a different request body returns 409. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        /** @description Organization identifier; possession does not confer authority. */
        oid: components['parameters']['OrganizationId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EventInput'];
      };
    };
    responses: {
      /** @description Draft created with an organizer assignment for the creator. */
      201: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DraftEventEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  resolveEventAccess: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['AccessResolutionInput'];
      };
    };
    responses: {
      /** @description Published-event preview and a credential-bound join intent. */
      200: {
        headers: {
          'Cache-Control': components['headers']['NoStore'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AccessResolutionEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  createConnectionRequest: {
    parameters: {
      query?: never;
      header: {
        /** @description CSPRNG-generated key with at least 128 bits of entropy, scoped to actor and route for 24 hours. Syntax validation cannot prove randomness. Reuse with a different request body returns 409. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RequestInput'];
      };
    };
    responses: {
      /** @description Existing same-direction or crossed pending request; receiver must explicitly decide. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PendingRequestEnvelope'];
        };
      };
      /** @description New pending request; no contact sharing. */
      201: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PendingRequestEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  acceptConnectionRequest: {
    parameters: {
      query?: never;
      header: {
        /** @description One strong quoted positive resource version, e.g. "1". Each operation identifies whether this is a request or profile version. Wildcards, weak validators and lists are not accepted. Service validates safe-integer range; 428 if missing, 412 if stale. */
        'If-Match': components['parameters']['IfMatch'];
        /** @description CSPRNG-generated key with at least 128 bits of entropy, scoped to actor and route for 24 hours. Syntax validation cannot prove randomness. Reuse with a different request body returns 409. */
        'Idempotency-Key': components['parameters']['IdempotencyKey'];
      };
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
        /** @description Request in the path event; inaccessible and unknown IDs return the same 404. */
        rid: components['parameters']['RequestId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Connection created without contact grants. ETag is the connection version. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ConnectionEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      412: components['responses']['PreconditionFailed'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      428: components['responses']['PreconditionRequired'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  declineConnectionRequest: {
    parameters: {
      query?: never;
      header: {
        /** @description One strong quoted positive resource version, e.g. "1". Each operation identifies whether this is a request or profile version. Wildcards, weak validators and lists are not accepted. Service validates safe-integer range; 428 if missing, 412 if stale. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
        /** @description Request in the path event; inaccessible and unknown IDs return the same 404. */
        rid: components['parameters']['RequestId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Pending request transitioned. ETag is the new request version. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['DeclinedRequestEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      412: components['responses']['PreconditionFailed'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      428: components['responses']['PreconditionRequired'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  withdrawConnectionRequest: {
    parameters: {
      query?: never;
      header: {
        /** @description One strong quoted positive resource version, e.g. "1". Each operation identifies whether this is a request or profile version. Wildcards, weak validators and lists are not accepted. Service validates safe-integer range; 428 if missing, 412 if stale. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
        /** @description Request in the path event; inaccessible and unknown IDs return the same 404. */
        rid: components['parameters']['RequestId'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Pending request transitioned. ETag is the new request version. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['WithdrawnRequestEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      412: components['responses']['PreconditionFailed'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      428: components['responses']['PreconditionRequired'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  replaceProfileInterests: {
    parameters: {
      query?: never;
      header: {
        /** @description One strong quoted positive resource version, e.g. "1". Each operation identifies whether this is a request or profile version. Wildcards, weak validators and lists are not accepted. Service validates safe-integer range; 428 if missing, 412 if stale. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProfileInterestsInput'];
      };
    };
    responses: {
      /** @description Selection replaced; returned ETag is the new profile version, not a consent version. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ProfileETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfileInterestsEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      412: components['responses']['PreconditionFailed'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      428: components['responses']['PreconditionRequired'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
  replaceProfileGoals: {
    parameters: {
      query?: never;
      header: {
        /** @description One strong quoted positive resource version, e.g. "1". Each operation identifies whether this is a request or profile version. Wildcards, weak validators and lists are not accepted. Service validates safe-integer range; 428 if missing, 412 if stale. */
        'If-Match': components['parameters']['IfMatch'];
      };
      path: {
        /** @description Event scope; live membership and resource relationships must be checked. */
        eid: components['parameters']['EventId'];
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProfileGoalsInput'];
      };
    };
    responses: {
      /** @description Author-only goal selection and new profile version; no peer/contact/style data. */
      200: {
        headers: {
          'Cache-Control': components['headers']['PrivateNoStore'];
          ETag: components['headers']['ProfileETag'];
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfileGoalsEnvelope'];
        };
      };
      400: components['responses']['BadRequest'];
      401: components['responses']['Unauthorized'];
      403: components['responses']['Forbidden'];
      404: components['responses']['NotFound'];
      409: components['responses']['Conflict'];
      412: components['responses']['PreconditionFailed'];
      413: components['responses']['TooLarge'];
      422: components['responses']['ValidationFailed'];
      428: components['responses']['PreconditionRequired'];
      429: components['responses']['RateLimited'];
      503: components['responses']['Unavailable'];
    };
  };
}
