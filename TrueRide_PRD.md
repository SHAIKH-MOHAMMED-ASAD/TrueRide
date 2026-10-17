# TrueRide — Continuous Rider Identity Intelligence

**Product Requirements Document (PRD) | Version 1.0 | Hackathon MVP**  
**Prepared:** 17 October 2026  
**Target submission:** 18 October 2026, 11:00 AM IST  
**Suggested repository:** `trueride-ai`

> **Product promise:** Trust the rider, not just the account. Continuously assess session risk, request stronger verification when justified, and avoid treating routine changes as fraud.

## Document purpose

This PRD is the source of truth for building TrueRide, an explainable continuous identity-risk monitoring prototype for delivery platforms. It covers the product problem, users, functional requirements, risk-scoring approach, analyst workflow, optional live-camera verification, architecture, data model, APIs, testing, privacy safeguards, acceptance criteria, and GitHub deliverables.

## 1. Executive summary

Delivery platforms may verify a rider during onboarding and then trust the account across many subsequent logins and sessions. That initial verification does not guarantee that the same person continues operating the account. A rider may rent or hand off an account, and the new operator may use the same credentials, phone, city, and delivery zone.

Repeated identity checks on every login can inconvenience legitimate riders when they change devices, travel, adjust working hours, or move between delivery zones. Indefinite trust, meanwhile, can allow account sharing to continue undetected.

**TrueRide** is a continuous identity-risk intelligence layer. It compares each eligible login or session with the individual rider's historical baseline, calculates an explainable risk score, and recommends a proportionate response: allow, monitor, request additional verification, or escalate for investigation.

The scoring engine uses four core categories—behavioral consistency, device consistency, location/travel consistency, and session/account changes—plus historical risk context. An optional live-camera verification module may provide a further step-up check using a consenting user's live image and an authorized reference portrait.

The hackathon MVP will use reproducible fictional rider profiles and synthetic session data. It must demonstrate real scoring and review logic and must not claim production-grade identity certainty or official Aadhaar authentication.

## 2. Problem statement

### 2.1 The Rented Account Problem

A delivery platform verifies a rider once, then relies on that approved account for future activity. If the account is rented or handed to another person, the second operator may make deliveries under the original rider's identity.

- **The Strict Gate:** Checking identity on every login can create unnecessary friction and block genuine riders over ordinary changes.
- **The Open Gate:** Trusting the original verification indefinitely can leave account handoffs undetected.

TrueRide must identify meaningful combinations of deviations while allowing plausible changes. The goal is to reduce undetected account sharing and minimize false positives—not to promise zero errors.

### 2.2 Key product insight

A device or location change is not proof of account sharing. Conversely, unchanged device and location do not prove that the same person is operating the account. The product must combine multiple permitted signals, show evidence quality, and provide step-up verification or human review when the evidence warrants it.

## 3. Goals, non-goals, and success outcomes

### 3.1 Goals

- Establish an individualized baseline from a rider's permitted historical session and delivery activity.
- Score incoming login and session events against that baseline.
- Detect potentially suspicious activity, including same-device/same-city scenarios when meaningful behavioral evidence exists.
- Avoid automatically escalating normal changes such as a new phone, travel, altered shifts, or delivery-zone changes.
- Explain each score using observable signals, expected ranges, and reason codes.
- Route risky or uncertain sessions into verification or analyst review.
- Persist session events, assessments, verification outcomes, decisions, and audit events.
- Evaluate the prototype using labelled synthetic scenarios and report measured results honestly.

### 3.2 Non-goals

The MVP will not guarantee detection of every account handoff; establish legal identity through behavior alone; replace onboarding checks; permanently ban a rider automatically from an experimental score; collect real Aadhaar details; claim official Aadhaar authentication; or require facial verification at every login. Distributed event streaming and production-scale infrastructure are also out of scope.

### 3.3 Success outcomes

Success means a working, explainable end-to-end prototype: event ingestion, baseline comparison, scoring, decision routing, dashboard inspection, verification or case review, and an auditable resolution. Quality must be judged on both detection and rider experience, especially false-positive behavior.

## 4. Users and personas

| Persona | Primary need | TrueRide capability |
|---|---|---|
| Trust & Safety Analyst | Understand why a session was flagged and resolve the case | Evidence view, rider timeline, review queue, decision records |
| Fraud Investigator | Investigate repeated or corroborated suspicious activity | Linked sessions, historical cases, risk explanations, audit trail |
| Verification Operator | Initiate and track additional checks | Verification requests, result states, recovery path |
| Risk Manager | Monitor performance and operational burden | Detection metrics, false-positive rate, challenge rate, latency |
| Delivery Rider | Continue working without needless friction | Risk-based checks, clear next steps, alternative review path |

## 5. Core workflow

1. **Session arrives:** an ingestion endpoint or simulator validates and records a login/session event.
2. **Baseline comparison:** the feature service retrieves the rider's baseline and derives current signal values.
3. **Risk assessment:** the engine produces an overall score, category contributions, evidence-quality indicator, explanations, and recommended action.
4. **Automated routing:** low-risk events continue; medium-risk or uncertain events may be monitored or challenged; high-risk events are sent for stronger verification or review.
5. **Analyst review:** the analyst opens a case, compares current and historic sessions, and inspects contributing evidence.
6. **Verification:** where appropriate, the platform requests an approved additional check. The result may be successful, unsuccessful, inconclusive, or unavailable.
7. **Decision:** an authorized reviewer resolves, dismisses, or escalates the case with a recorded reason.
8. **Audit and feedback:** the system stores the outcome. Baselines update only under an explicit trust/review policy; suspicious unresolved sessions must not silently become trusted baseline data.

## 6. Functional requirements

### FR-01 — Rider profiles

Maintain fictional or authorized rider profiles with a unique ID, enrollment date, account status, baseline status, known device history, typical operating zones, historical session patterns, recent assessments, and open/resolved cases. Display when the historical sample is too sparse for a reliable comparison.

### FR-02 — Session event ingestion

Accept validated session events containing rider ID, unique event/session IDs, timestamp, device identifier, approximate zone, login/logout information, permitted interaction summaries, delivery-action summaries, session duration where available, and relevant account/session changes. Handle missing fields explicitly and make repeated ingestion idempotent.

### FR-03 — Individualized behavioral baseline

Maintain per-rider statistics for typical login hours/days, session duration, timing between permitted interactions, delivery-action sequences, delivery acceptance/completion patterns, operating-zone transitions, device history, and account/session changes. A rolling window such as 30 days may be used when sufficient data exists. Do not use one universal behavioral template for all riders.

### FR-04 — Risk signals

Implement five distinct, testable categories:

| Category | Initial weight | Examples |
|---|---:|---|
| Behavioral consistency | 25% | Interaction timing/sequences, session duration, delivery patterns, multi-session drift |
| Device consistency | 20% | Known/unfamiliar device, device history, contextual device change |
| Location & travel consistency | 15% | Familiar zones, plausible travel, unexpected transitions |
| Session & account changes | 20% | Unusual session transitions, re-login sequences, relevant security-setting changes |
| Historical risk context | 20% | Repeated corroborated anomalies and relevant prior case outcomes |

Weights are initial design assumptions, not validated production parameters. Weights and thresholds must be configurable. Dismissed alerts must not keep penalizing a rider without new supporting evidence. Sensitive credentials must not be collected merely to compute a score.

### FR-05 — Explainable risk engine

Implement the risk engine as a standalone, unit-testable module. For every assessment, return:

- Risk score from 0–100.
- Evidence-quality/confidence indicator, kept distinct from risk.
- Category scores and weighted contributions.
- Triggered signal codes, observed values, and baseline/expected ranges.
- Human-readable reason codes.
- Recommended action and scoring configuration/version.

**Illustrative formula:** 0.25 × behavioral + 0.20 × device + 0.15 × location/travel + 0.20 × session/account + 0.20 × historical risk. Normalize category scores and final results to 0–100. Account for missing values and avoid double-counting correlated signals. Missing data must not automatically imply suspicious activity.

### FR-06 — Risk-based decision policy

Initial configurable bands:

| Score | Initial level | Suggested response |
|---|---|---|
| 0–29 | Low | Allow and continue monitoring |
| 30–69 | Medium | Monitor or request additional verification |
| 70–100 | High | Stronger verification and/or investigation; consider temporary restriction of sensitive actions where authorized |

These are simulation thresholds, not validated production cutoffs. The final action must account for evidence quality and service availability. A high score alone must never cause an automatic permanent ban.

### FR-07 — Session simulator

Provide deterministic scenarios for: normal login; legitimate new phone; plausible delivery-zone change; shift/time change; unusual session pattern; possible handoff on a different device; same-device/same-city handoff; multiple behavioral deviations; sparse history; and a false-positive alert that can be dismissed. The simulator must call the real scoring engine—not return hardcoded scenario scores.

### FR-08 — Analyst dashboard

Show total riders represented, sessions analyzed, low/medium/high-risk counts, open investigations, verification requests/outcomes, risk distribution, session trends, recent alerts, and review workload. Metrics must be derived from persisted records. Clearly label synthetic/demo metrics. Include filters by rider, date, risk level, case status, and verification result.

### FR-09 — Rider profile and session investigation

Allow analysts to search riders, inspect baselines, view chronological session timelines, compare current and historic signals, inspect category contributions, review past assessments, open linked cases, and see verification outcomes and audit events. Clearly distinguish observed facts, model-generated conclusions, and human decisions.

### FR-10 — Security review queue

Support case states such as New alert, Monitoring, Verification required, Under investigation, Verified legitimate, Confirmed account handoff, and Dismissed alert. Analysts may inspect evidence, add notes, request verification, mark a case legitimate, record a supported finding, dismiss a false positive, or resolve/escalate a case. Record timestamps, reviewer identifiers/demo role, reasons, and state changes.

### FR-11 — Verification service abstraction

Represent a verification request with request ID, rider ID, linked session/assessment/case IDs, verification type, timestamp, and status. Results must distinguish successful verification, non-match/unsuccessful, inconclusive, and technical failure/unavailable. An inconclusive or unavailable check is not proof of account sharing; the case needs a recovery or manual-review path.

### FR-12 — Optional live-camera face verification

This feature is a second-stage check, not the core risk engine. With appropriate consent, the browser requests camera permission and captures a live image. An optional Python/FastAPI service may use OpenCV for face detection, image-quality checks, cropping/alignment, and a compatible facial-embedding model for comparison against an authorized, previously enrolled reference portrait.

Return MATCH, NO MATCH, or INCONCLUSIVE, plus image-quality information and a model similarity score. Do not describe similarity as the probability of identity. Facial symmetry or raw landmark distances must not be presented as reliable identity verification.

Use fictional test riders and authorized synthetic reference portraits for the hackathon. Do not collect real Aadhaar numbers or documents and do not claim official Aadhaar authentication. Process raw webcam captures in memory and discard them by default; do not log images or embeddings. Provide an alternative verification/manual-review path if the camera is denied or the service fails. Do not claim liveness or anti-spoofing unless a suitable capability has actually been implemented and evaluated.

### FR-13 — Audit log

Record event ingestion, assessment creation, verification requests/results, case transitions, analyst decisions/notes, baseline changes, and relevant configuration changes. Each record must have an event type, timestamp, entity identifiers, and summary. Avoid storing raw biometric imagery or unnecessary sensitive personal information in logs.

### FR-14 — Evaluation metrics

Compute actual metrics on a labelled, held-out synthetic test set: true/false positives, true/false negatives, precision, recall, false-positive rate, challenge rate, and scoring latency. Include both suspicious account-handoff scenarios and legitimate changes. Label synthetic results as synthetic and do not present them as production accuracy.

## 7. Analyst dashboard workflow and evidence

When a session is flagged, the analyst should see the risk score, evidence quality, signal categories, actual observations versus rider baseline, timestamp, device and approximate zone context, relevant session transitions, recent related sessions, prior case outcomes, and recommended action.

The analyst should be able to compare sessions, inspect each reason code, request step-up verification, record a decision, and add an explanation. Evidence must be traceable to the source session and scoring version.

Example: the device and city remain unchanged, but multiple meaningful behavioral and session features deviate from the rider's baseline. The system may recommend verification and display the contributing evidence. This is a risk signal—not proof that a different person is operating the account.

## 8. User interface and navigation

### Design direction

Use a polished cybersecurity SaaS interface with a dark navy base, restrained teal and amber accents, red reserved for important high-risk states, readable typography, clear spacing, accessible status indicators, and responsive layouts.

### Required pages

1. Overview Dashboard.
2. Rider Directory.
3. Rider Profile.
4. Session Monitor.
5. Session Simulator.
6. Security Review Queue.
7. Case Details.
8. Verification Screen.
9. System Evaluation.
10. Audit Log.

All primary controls must be functional. Provide useful loading, empty, success, and error states. Dashboard numbers must be derived from data, not decorative hardcoded values.

## 9. Technical architecture

### Recommended MVP stack

- **Frontend:** Next.js App Router, TypeScript, Tailwind CSS.
- **Application/API:** Next.js server routes or a lightweight backend; Zod request validation.
- **Risk engine:** Standalone TypeScript module, independent of UI/database calls.
- **Persistence:** SQLite and Prisma ORM, with migrations and a seed script.
- **Optional computer vision:** Python, FastAPI, OpenCV, and a compatible facial-embedding model.
- **Testing:** Vitest plus API/integration tests where feasible.

The core application must run without an external LLM API or the optional Python service. Do not assume that the coding model inside Antigravity is automatically available as an application runtime model. Avoid microservices, Redis, Kafka, or production cloud infrastructure for the hackathon MVP.

### Logical components

1. Session event ingestion and normalization.
2. Feature and baseline service.
3. Explainable risk engine.
4. Policy/decision engine.
5. Verification service abstraction.
6. Analyst dashboard and case management.
7. Audit and evaluation layer.

## 10. Data model

| Entity | Core fields |
|---|---|
| Rider | ID, display identifier, enrollment date, account status, baseline status, timestamps |
| SessionEvent | ID, external event ID, rider/session IDs, timestamp, device ID, approximate zone, feature summary, ingestion status |
| BehavioralBaseline | ID, rider ID, version, observation window, feature statistics, sample count, confidence, updated time |
| RiskAssessment | ID, rider ID, session event ID, score, evidence quality, level, recommended action, scoring version, timestamp |
| RiskSignal | ID, assessment ID, category, signal code, observed value, expected range, subscore, contribution, explanation, evidence quality |
| SecurityCase | ID, rider ID, assessment ID, status, priority, reviewer, resolution reason, created/resolved timestamps |
| VerificationEvent | ID, rider/case/session IDs, verification type, result, failure reason, timestamp |
| ReviewDecision | ID, case ID, reviewer/demo role, decision, reason, timestamp |
| AuditEvent | ID, actor, event type, entity type/ID, summary, timestamp |

Use stable identifiers and database relationships. Keep sensitive imagery out of the main records unless a separately justified and properly protected use case requires otherwise.

## 11. API requirements

Example local API routes:

- `POST /api/sessions/ingest` — validate and store a session event.
- `GET /api/sessions` — list/filter sessions.
- `GET /api/sessions/:id` — retrieve a session and assessment.
- `POST /api/sessions/:id/assess` — run/re-run scoring.
- `GET /api/riders` — list riders.
- `GET /api/riders/:id` — rider profile and history.
- `GET /api/cases` — list security cases.
- `GET /api/cases/:id` — case details/evidence.
- `POST /api/cases/:id/decision` — record an analyst decision.
- `POST /api/verification/request` — create a verification request.
- `POST /api/verification/:id/result` — record a simulated result.
- `GET /api/dashboard/metrics` — return persisted dashboard metrics and computed evaluation summaries from the labelled test set.

If the optional Python service is implemented, it may expose `POST /verify/compare` using validated image input and an authorized reference identifier. Do not expose arbitrary reference-image file access. Validate inputs and avoid returning secrets or internal stack traces.

## 12. Non-functional requirements

- **Performance:** Measure risk-scoring latency. A proposed local scoring target is p95 below 200 ms excluding camera capture and external-service delays; this is a target, not a proven result.
- **Reliability:** Handle duplicate events, missing historical data, model/service failure, verification timeouts, and persisted case history.
- **Security:** Validate API inputs, use safe database access, protect routes appropriate to implemented roles, keep secrets in environment variables, and avoid sensitive logs.
- **Auditability:** Persist evidence, scoring version, actions, and review outcomes.
- **Scalability:** The hackathon version is a local prototype; large-scale production capacity is not verified.
- **Accessibility:** Use understandable status labels, keyboard-accessible controls, readable contrast, and camera-independent recovery options.

## 13. Privacy, fairness, and safeguards

TrueRide may affect a person's ability to work, so safeguards are mandatory:

- Collect only necessary, proportionate signals.
- Do not use sensitive or unrelated personal traits to infer identity.
- Do not treat one behavioral deviation as proof of account sharing.
- Separate risk score from evidence quality.
- Do not treat missing data as suspicious by default.
- Provide accessible recovery and alternative verification paths.
- Avoid permanent bans based solely on experimental scores.
- Keep unresolved suspicious sessions from silently updating a trusted baseline.
- Record dismissed alerts and monitor false-positive rates.
- Define retention/deletion policies before any production deployment.
- Obtain appropriate consent and authorization for biometric verification.
- Use synthetic rider data and authorized reference images for the hackathon.

## 14. Test strategy

### Risk-engine unit tests

1. Normal known-device session with consistent behavior is low risk.
2. New device alone does not create a high-risk classification.
3. Plausible delivery-zone change does not automatically escalate.
4. Multiple meaningful behavioral deviations increase risk appropriately.
5. Same-device/same-city case can be flagged when meaningful independent evidence exists.
6. Sparse history lowers evidence quality.
7. Missing signals are not silently treated as suspicious.
8. Correlated signals do not unjustifiably inflate risk.
9. Dismissed alerts do not repeatedly inflate future scores without new evidence.
10. Explanations match actual score contributions.
11. Configured weights/thresholds produce predictable results.
12. Event ingestion is idempotent.

### End-to-end integration test

Ingest session → compare baseline → score → display explanation → create case → request verification → record outcome → record analyst decision → verify audit log and dashboard updates.

### Optional face-verification tests

Test same/different synthetic references, no face, poor image quality, denied camera permission, unavailable service, and match/non-match/inconclusive paths. Do not claim production liveness or anti-spoofing unless implemented and evaluated.

## 15. Seed data and demo scenarios

Seed fictional rider profiles and several weeks of repeatable session history. Include normal logins, legitimate device changes, plausible location changes, modified shifts, suspicious new-device sessions, same-device/same-city behavioral shifts, unusual session transitions, sparse history, and a dismissible false-positive alert.

Keep labels independent of the scoring algorithm so evaluation is meaningful. Provide a safe demo-reset command that restores seed data without deleting source code.

## 16. GitHub and submission deliverables

**Suggested repository:** `trueride-ai`.

Include:

- Application source code and API routes.
- Risk engine and tests.
- Database schema, migrations, and seed scripts.
- Package manifest and lockfile.
- `.gitignore` and `.env.example` with placeholders only.
- `README.md` with setup, stack, architecture, risk model, configuration, database initialization, seeding/reset, running tests, demo scenarios, evaluation interpretation, optional camera service, and limitations.

Before committing, inspect Git status and staged changes. Exclude secrets, private images, uploaded identity documents, local databases containing sensitive data, logs, build artifacts, and `node_modules`. Preserve existing history and do not force-push. If GitHub CLI is authenticated and repository creation is allowed, create and push the repo. Otherwise, complete the local Git repository and provide exact push commands. Never claim a remote push succeeded unless it actually did.

## 17. Hackathon implementation plan

1. **Foundation:** inspect repository, app shell, database, rider seeds.
2. **Risk engine:** five categories, normalized scoring, explanations, unit tests.
3. **Simulator:** normal, legitimate-change, and account-handoff scenarios using the real engine.
4. **Dashboard and cases:** rider history, evidence view, review queue, audit log.
5. **Verification:** simulated step-up workflow and recovery states.
6. **Optional camera module:** add only after the core application works and only if it can be installed and tested reliably.
7. **Submission quality:** run tests/build, fix critical errors, complete README, check Git hygiene, commit, and push where authorized.

If time becomes constrained, prioritize a functional risk engine, real simulator, explainable evidence, persistent case workflow, core tests, and a clean source repository over optional features and visual effects.

## 18. Acceptance criteria

The MVP is ready when it can:

1. Initialize a database with reproducible fictional riders and sessions.
2. Ingest a valid session event and avoid duplicate processing.
3. Compare features with the rider's own baseline.
4. Produce overall/category scores, evidence quality, explanations, and a recommendation.
5. Apply configured risk thresholds and proportionate action routing.
6. Demonstrate legitimate changes without automatic high-risk classification.
7. Demonstrate same-device/same-city deviations when meaningful evidence exists.
8. Display assessments and rider history in the dashboard.
9. Create and update investigation cases.
10. Complete and audit simulated verification outcomes.
11. Persist analyst decisions and audit events.
12. Compute evaluation metrics from labelled test data.
13. Run essential automated tests and a production build attempt, with results documented honestly.
14. Start using documented local commands.
15. Include a GitHub-ready repository without committed secrets.

The camera module is complete only if the live capture, backend comparison, inconclusive handling, and error states actually work and have been tested. Otherwise, document it as not implemented or experimental.

## 19. Product risks and mitigations

| Risk | Mitigation |
|---|---|
| False positives from normal changes | Individual baselines, multi-signal evidence, configurable thresholds, verification/review paths |
| Weak or sparse history | Evidence-quality indicator, conservative handling, no automatic high-risk inference from missing data |
| Same device/location hides a handoff | Use permitted behavioral and session signals; acknowledge detection limits where evidence is insufficient |
| Correlated features inflate scores | Cap contributions and avoid double-counting correlated evidence |
| Biometric integration delays MVP | Keep face verification optional and isolate it from the core application |
| Synthetic metrics look better than reality | Label them clearly and avoid claims of production accuracy |
| Sensitive data exposure | Use synthetic data, minimal retention, secret hygiene, and no biometric logging |
| Deadline risk | Build vertical slices, maintain a runnable app, prioritize core logic over polish |

## 20. Final product definition

TrueRide is a continuous identity-risk system, not merely a login anomaly detector or face-recognition application. It combines personalized behavioral baselines, multiple complementary signals, explainable risk scoring, proportionate verification, analyst-led investigation, and auditable outcomes.

Its business objective is to reduce undetected rented-account activity while minimizing unnecessary disruption to genuine riders. The hackathon prototype must demonstrate this balance with working application logic and reproducible synthetic scenarios, while being transparent about the limits of behavioral inference and optional facial verification.
