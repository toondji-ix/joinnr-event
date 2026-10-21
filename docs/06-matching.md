# 06 — AI matching engine

## 1. Objective, inputs and safeguards

Local implementation, 21 October 2026: `packages/domain/src/taxonomy-matching.ts` implements the pure interest/reciprocal-goal ranking core with eight synthetic regression tests. It takes caller-supplied versioned rules/weights and trusted eligibility snapshots; it does not approve the proposed weights below, implement live authorization, rank actual attendees, render public explanations or establish relevance lift. Semantic/style/exposure reranking and persistence remain unimplemented. Candidate providers received a [documentation comparison](technical-completion-review.md#providermodel-desk-evaluation), not a measured evaluation or selected model.

Rank opportunities for a useful two-way conversation within one conference. This is a recommendation aid, not a predictor of friendship, personality, employment suitability or investment quality. Learned embeddings support semantic relevance; access, inclusion and consent remain ordinary deterministic application rules.

Use selected interests, structured seek/offer goals, user-approved public goal summaries, optional professional headline/background, declared experience preference and optional declared interaction style. Exclude contacts, precise location, age, ethnicity, religion, disability, inferred personality, external social data and private feedback text from matching. Do not infer sensitive traits from names, photographs or embeddings. Profile photos/names are display-only, never model features. Any regulated-use extension requires separate review.

MVP learned component: a provider-hosted text embedding model approved for regional processing, data terms, dimensions, version pinning and deletion obligations. AWS Bedrock Titan Text Embeddings V2 is a candidate for the proposed AWS stack, not a presumed enabled or regionally available integration. Phase four records actual model ID, vector dimension, token limit, throughput, cost, terms and evaluation result before enabling. No LLM reranker or generated explanations. If no approved model offers measured lift, ship explicit taxonomy recommendations only and describe the product accurately; do not call a random similarity number AI.

## 2. Eligibility before ranking

1. Validate actor active account, active event membership, complete required profile, networking consent, current networking window and event not cancelled/expired.
2. Limit pool to the same event and equivalent eligible state. Exclude self, either-direction global block, suspended/deleting accounts, ended/accepted connection pairs, pending requests, and declines within cooldown. Opposite-direction pending requests are handled in received requests rather than a new suggestion.
3. Verify current profile versions, consent and retained-data window. Filter at retrieval and again before display/request; previously stored ranks never bypass live checks.
4. Availability preference “paused” is networking disabled. No geographic proximity or device contact book required.

Eligibility is hard filtering, never a score penalty. Recall from approximate retrieval cannot bypass it. Candidate pool may be empty or smaller than five; return honest emptiness. A sparse event never uses another event's attendees as filler.

## 3. Feature calculation and candidate generation

Sanitized embedding input is a labeled sequence of reviewed taxonomy labels, direction-specific public goal summaries, professional headline and optional user-approved background. Cap length and remove contact patterns; free-text detail marked private is excluded. Provider processing consent is separate; without it, use structured signals only. Store only vector, input hash, model/profile version and metadata. No raw text in provider/debug logs under app control. Treat input text as data, never instructions. A text embedding call has no tool access or authority to act.

For <=5,000/event: on demand per actor, scan eligible event profiles using indexed event filter and retrieve top 100 by exact cosine similarity, union with top 100 by structured reciprocal-goal fit and a bounded 20 eligible underexposed candidates. Deduplicate; cap candidate set at 220. No all-pairs materialization: 5,000² unnecessary computations would delay live refreshes. For taxonomy-only users, retrieve with goals/interests and underexposed pool. Underexposed selection uses eligible exposure counts plus stable hashed tie-break; does not use protected attributes. Cache a run for up to 15 min, invalidate immediately on consent/block/lifecycle changes, debounce frequent edits (proposed 10 s), and prioritize active actors. Refresh queues are bounded; visible reads may use safe still-valid fallback while recompute happens.

## 4. Proposed transparent scoring baseline

All features normalized [0,1]; weights are proposed starting hypotheses, frozen and versioned for pilot comparison.

| Feature | Calculation | Weight |
|---|---|---|
| G: reciprocal goals/opportunities | Directional fit using explicit topic compatibility table, then harmonic mean of actor→candidate and candidate→actor; shared peer goals allow mutual seek | 0.40 |
| I: interests | Jaccard overlap of selected taxonomy IDs; maximum overlap is not a mandate | 0.20 |
| S: semantics/background | Clipped/rescaled cosine of valid same-model embeddings using evaluation-set scale; not a probability | 0.20 |
| E: declared experience intent | Match learn/share or peer preference with declared levels; neutral omission excludes this feature | 0.10 |
| P: style preference alignment | Mean agreement on voluntarily answered collaboration preferences, only if both opted in; not a trait inference | 0.10 |

`score = sum(available_weight × feature) / sum(available_weight)`. Missing optional E/P/S removes its weight from numerator and denominator; never zero-fill optional answers. Required G/I remain available, so denominator cannot be zero for eligible profiles. If one party lacks semantic consent, remove S for that pair. No ranking uplift solely for completing style. Evaluate cohorts with and without optional features to ensure normalization does not create systematic disadvantage.

Directional goal compatibility table, versioned examples: seeking mentorship ↔ offering mentorship; seeking a role ↔ offering hiring opportunities; seeking investment ↔ offering investment discussions; seeking customers ↔ offering a relevant solution evaluation/need; seeking partnership ↔ offering partnership; seeking peers ↔ seeking peers with shared topic. Never pair “seeking investment” with another “seeking investment” as complementary intent merely because text matches. Topic overlap must accompany direction fit. Explicit seek/offer tags describe conversation goals, not proof of available funding/jobs. A pair may have asymmetric fit; show the actual facts, not a false mutual-benefit claim.

Greedy reranking of top five subtracts `0.15 × max similarity to already selected profiles` using non-sensitive goal/interest representation and applies a soft exposure budget so one highly requested attendee does not dominate. Proposed inbox limit 20 pending received requests; reaching it pauses new recommendations targeting that member until capacity clears. Do not silently discard their received requests. Reserve at most one of five positions for an underexposed eligible candidate above a tested structured relevance threshold; disable exploration if pilot evidence shows worse outcomes. Keep stable seeded order within a run to avoid distracting shuffles. These are tunable policies, not universal best practices.

Use background relevance without ranking by prestige, company size or exact job title hierarchy. Experience is declared early/mid/senior/prefer-not, not inferred from age. Personality contribution is launched behind a flag only after evaluation; assessment UI remains available and optional. Describe it as interaction style in the product to avoid unsupported science.

## 5. Assessment specification

Version `networking-style-1`: four questions on a 1–5 labeled continuum, each with neutral option and per-step skip:

1. Conversation pace: deliberate reflection ↔ quick exchange.
2. Structure: clear topic/agenda ↔ open exploration.
3. Interaction preference: listening first ↔ sharing ideas first.
4. Conversation depth: one topic in depth ↔ several topics briefly.

Use similarity as the initial hypothesis; do not assert that opposites attract or call this a validated Big Five instrument. Store answers privately with explicit consent. Question wording is a concrete proposed instrument requiring comprehension and bias review, not a psychometric validation claim. Skipping one question resolves assessment as partial; only mutually available dimensions contribute to P. If none overlap, omit P. The API accepts exactly four slots each `1..5|null`, plus a skip-all operation. Assessment completion means the attendee has answered or explicitly skipped each question; no answer is mandatory.

## 6. Explanations and feedback

Generate two or three template reasons from facts the user may see: “You both selected developer platforms,” “You seek mentorship; they offer it,” or “You both want to exchange partnership ideas.” No private-goal detail or style-answer leakage, no fabricated shared interest and no causal assertion that a score guarantees value. If public evidence cannot support a reason, omit it or exclude the candidate from the top list pending review. Log reason codes and fact references, not raw profile text.

Collect exposure → request → acceptance → relevant rating → useful outcome as separate signals. Decline is not a universally negative label; unavailable attendees may decline good matches. Nonresponse is missing data. Feedback text is reviewed by authorized product/safety staff only and excluded from automatic training in MVP. Do not automatically train a ranking model on early clicks or optimize popularity. Reweighting requires offline evaluation, documented version change, guarded rollout and rollback path.

## 7. Evaluation, monitoring and rollout

Create a consented, deidentified test set with proposed >=100 judged pairs across conference types, reciprocal and contradictory goals, seniority, sparse profiles, optional style absence and new members. Include synthetic boundary tests but distinguish them from human relevance labels. Two reviewers independently rate relevance 0–3 and rationale accuracy; adjudicate disagreement. Split by event/person, not pair row, to avoid leakage.

Compare taxonomy-only baseline, semantic hybrid and hybrid with style. Offline gates: 100% eligibility/tenant/blocked-pair invariants, 100% fact-supported explanation checks on reviewed sample, no material degradation in precision@5 or NDCG@5, and measured improvement in at least one relevance metric over baseline. Record actual values, bootstrap intervals and sample limitations; do not invent a 90% accuracy target. A pilot cannot validate personality compatibility scientifically.

Online: event-level guarded rollout avoids changing all attendees at once; randomize within an event only with explicit experimental design accounting for pair interference. Monitor recommendation coverage, exposure concentration, new-member exposure, optional-data cohort outcomes, goal-cohort acceptance and useful outcomes. Suppress tiny slices. Demographic fairness claims require ethically collected consented data and sufficient sample; do not infer demographics. Follow the governance/evaluation principles in [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework).

Operational gates: p95 refresh <=120 s, invalid/unsafe recommendation rate zero, approved model cost per activated user within phase-four budget, failed provider calls trigger circuit breaker after bounded retries. Kill switches independently disable semantic matching, style feature and exploration. Fallback reuses current eligible goal/interest ranking, marks mode and produces real reasons. A faulty ranking rollout reverts algorithm version; a model-version change rebuilds vectors in a separate column/table partition and activates only after full evaluation, never mixes old/new embedding spaces. Erasure and withdrawal purge vectors and pending jobs; workers check current consent/version immediately before and after provider invocation.
