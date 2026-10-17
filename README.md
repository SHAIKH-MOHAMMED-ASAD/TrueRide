# TrueRide — Continuous Rider Identity Intelligence
> **Tagline:** Trust the rider, not just the account.  
> **Problem Statement:** The Rented Account Problem (Hackathon Edition)  
> **Repository:** `trueride-ai`

---

## 1. Problem Statement and Solution

### The Rented Account Problem
On delivery platforms, identity verification typically takes place once during onboarding. Once an account is approved, the platform assumes that every future login and delivery session is conducted by that same verified individual.

In practice, accounts are frequently rented, lent, or handed off to unverified third parties. An unauthorized operator may operate under the genuine rider's identity while using:
1. A completely new device in a different city, or
2. **The genuine rider's original phone in the same city and delivery zone** (the most difficult fraud pattern to detect).

- **The Strict Gate:** Forcing biometric checks on every single login causes massive inconvenience, anger, and workflow delays for genuine riders during routine changes (e.g. buying a new phone, working a night shift, or delivering in an adjacent neighborhood).
- **The Open Gate:** Trusting every login indefinitely leaves account sharing, safety breaches, and unauthorized deliveries undetected.

### The TrueRide Solution
**TrueRide** is an explainable continuous identity-risk intelligence layer. Instead of verifying riders on every login or trusting them blindly, TrueRide:
- Learns an **individualized behavioral baseline** from each rider's historical delivery patterns.
- Continuously assesses incoming sessions across **five core risk-signal categories**.
- Calculates an **explainable risk score (0–100)** with clear reason codes and observed vs baseline comparisons.
- Separates **evidence quality** from suspiciousness so new riders with sparse history are never unfairly penalized.
- Initiates **proportionate step-up verification** (such as a 2-second live face check) only when risk warrants it.
- Provides a **Trust & Safety analyst dashboard** with investigation workflows, persistent decision logging, and an immutable audit trail.

---

## 2. Core Features

1. **Individualized Behavioral Baselines:**
   - Characteristic touch interaction interval pacing ($\mu$ and $\sigma$).
   - Typical shift operating hours and working days.
   - Enrolled hardware device signature registry.
   - Primary delivery zones and plausible cluster transitions.
   - Historic delivery acceptance and completion percentages.
   - Versioned baseline updates protected by an explicit trust review policy.

2. **Five Core Risk-Signal Categories:**
   - **Category A: Behavioral Consistency (25%):** Touch cadence, order acceptance collapse, navigation hesitation, multi-session drift.
   - **Category B: Device Consistency (20%):** Hardware ID registry match, correlated anomalies. *Rule: A new phone alone never triggers high risk.*
   - **Category C: Location & Travel Consistency (15%):** Familiar zones vs plausible neighboring cluster re-allocation. *Rule: Travel alone never triggers high risk.*
   - **Category D: Session & Account Changes (20%):** Rapid device handoff re-logins, payout UPI/bank account alteration right before shift.
   - **Category E: Historical Risk Context (20%):** Multi-session persistent drift, prior substantiated handoffs, unresolved alerts. *Rule: Dismissed false positives never penalize future sessions.*

3. **Interactive Session Simulator (Critical Demo Feature):**
   - 9 deterministic scenarios running through the real server ingestion pipeline:
     1. Normal Routine Session (Low risk, Allowed)
     2. New Phone Upgrade (Low risk, Proves new hardware alone is safe)
     3. Legitimate Delivery Zone Change (Low risk, Proves zone transition is safe)
     4. Off-Hours / Night Shift Transition (Low risk, Informational signal)
     5. Suspicious Behavior on Unfamiliar Device (High risk, Step-up challenge)
     6. **Possible Account Handoff on Same Phone & Same City** (Flags rented account using behavioral pacing alone, overcoming hardware and GPS spoofing!)
     7. Persistent Multi-Session Behavioral Drift (High risk, Corroborated drift)
     8. Sparse History / New Rider (Explicit evidence limitation, Monitor without penalty)
     9. Dismissible False Positive Alert (Simulated touch latency from rain moisture, dismissed by analyst without future baseline penalty)

4. **Trust & Safety Analyst Review Queue:**
   - Investigation triage states: *New Alert, Monitoring, Verification Required, Under Investigation, Verified Legitimate, Confirmed Account Handoff, Dismissed Alert*.
   - Telemetry comparison: Observed session vs Rider baseline.
   - Decision persistence: Records reviewer, decision, justification, and audit record.

5. **Step-Up Biometric Verification Studio:**
   - Live browser webcam feed with face detection framing box.
   - Simulated 512-dimensional vector comparison against enrolled reference portrait.
   - Handles *MATCH*, *NO_MATCH*, and *INCONCLUSIVE* outcomes.
   - Non-punitive recovery fallback: Manual supervisor review path if lighting or camera fails.

6. **Model Evaluation & Accuracy Benchmark:**
   - 15 held-out labelled test scenarios evaluated with ground truth.
   - Live Confusion Matrix (TP, FP, TN, FN).
   - Computed Precision, Recall, False Positive Rate, Challenge Rate, and Measured P95 Latency.

7. **Cryptographic Audit Trail:**
   - Immutable audit log for session ingestion, scoring assessments, case creations, analyst decisions, and verification results.

---

## 3. Technology Stack

- **Framework:** Next.js 16 (App Router, Turbopack, Server-side Route Handlers)
- **Language:** TypeScript 5 (Strict type checking)
- **Database & ORM:** SQLite with Prisma ORM 6 (Local, zero external cloud dependencies)
- **Validation:** Zod 4 (Strict runtime payload validation)
- **Styling:** Tailwind CSS 4 with custom dark navy cybersecurity SaaS theme
- **Icons:** Lucide React
- **Testing:** Vitest 5 (16 automated unit and integration tests)
- **Runtime:** Node.js v20+ / v24+

---

## 4. Architecture

```
                    +-------------------------------------------------+
                    |             DELIVERY APP / SIMULATOR            |
                    +-------------------------------------------------+
                                             |
                                  POST /api/sessions/ingest
                                             v
                    +-------------------------------------------------+
                    |           SESSION INGESTION SERVICE             |
                    |   * Zod Schema Validation                       |
                    |   * Idempotency Check (Duplicate Deduplication) |
                    +-------------------------------------------------+
                               |                             |
                 Fetch Baseline & Context             Persist Event
                               v                             v
+------------------------------------+             +-------------------+
|     STANDALONE RISK ENGINE         |             |   SQLite DATABASE |
|  * Category A: Behavioral (25%)    |             |   * Rider         |
|  * Category B: Device (20%)        |             |   * Baseline      |
|  * Category C: Location (15%)      |             |   * SessionEvent  |
|  * Category D: Session/Acct (20%)  |             |   * Assessment    |
|  * Category E: Historical (20%)    |             |   * RiskSignal    |
|  * Evidence Quality Assessment     |             |   * SecurityCase  |
|  * Action Routing Policy           |             |   * Verification  |
+------------------------------------+             |   * AuditEvent    |
                               |                   +-------------------+
                       Assessment Result                     ^
                               +-----------------------------+
                                             |
                                             v
                    +-------------------------------------------------+
                    |        TRUST & SAFETY ANALYST DASHBOARD         |
                    |  * Overview KPIs & Risk Distribution Charts     |
                    |  * Review Queue & Case Investigation Dossier    |
                    |  * Step-Up Biometric Studio (Webcam Stream)     |
                    |  * Held-Out Model Evaluation Benchmark         |
                    |  * Immutable Security Audit Log                 |
                    +-------------------------------------------------+
```

---

## 5. Risk-Scoring Formula

Every category score is normalized to a continuous scale from $0$ to $100$:

$$\text{Overall Risk Score} = (S_{\text{beh}} \times 0.25) + (S_{\text{dev}} \times 0.20) + (S_{\text{loc}} \times 0.15) + (S_{\text{acct}} \times 0.20) + (S_{\text{hist}} \times 0.20)$$

### Configurable Weights & Thresholds
| Parameter | Default Value | Role |
|---|---|---|
| Behavioral Weight | `0.25` | Pacing, cadence, order completion |
| Device Weight | `0.20` | Hardware signature registry match |
| Location Weight | `0.15` | Operating zone transition |
| Session & Account Weight | `0.20` | Rapid relogins, payout changes |
| Historical Context Weight | `0.20` | Persistent multi-session drift |
| **Low Risk Band** | `0 – 29` | **ALLOW** (Continue monitoring) |
| **Medium Risk Band** | `30 – 69` | **MONITOR** or **STEP-UP VERIFY** |
| **High Risk Band** | `70 – 100` | **STEP-UP VERIFY** / **ESCALATE** |

---

## 6. Installation and Setup

### Prerequisites
- Node.js version 20.x, 22.x, or 24.x
- npm version 10+ or 11+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/sohail/trueride-ai.git
cd trueride-ai
```

### 2. Install dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Setup environment variables
Create `.env` using `.env.example`:
```bash
cp .env.example .env
```
Content of `.env`:
```env
DATABASE_URL="file:./dev.db"
```

### 4. Initialize Database and Seed Reproducible Records
```bash
npx prisma db push
npm run seed
```

---

## 7. Run Commands

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

### Database Seed / Reset Command
To restore clean seed data at any time without altering source code:
```bash
npm run seed
```
*(Or click the "Reset Demo DB" button in the dashboard top navigation bar).*

---

## 8. Automated Test Commands

Run the full automated test suite (16 tests across Risk Engine, Integration, and Evaluation):
```bash
npm test
```

### What the Automated Tests Verify:
1. `Scenario 1`: Normal login produces low risk (`<= 29`).
2. `Scenario 2`: New device alone does NOT trigger high risk.
3. `Scenario 3`: Plausible zone transition does not trigger high risk.
4. `Scenario 4`: Multiple meaningful behavioral deviations elevate risk.
5. `Scenario 5`: Same-device, same-city handoff is flagged using behavioral evidence alone.
6. `Scenario 6`: Sparse history yields explicit evidence limitation (`INSUFFICIENT`) without assuming guilt.
7. `Scenario 7`: Missing signals are handled gracefully without inflating scores.
8. `Scenario 8`: Correlated signals are capped and normalized to avoid double-counting.
9. `Scenario 9`: Dismissed alerts do NOT repeatedly penalize a rider.
10. `Scenario 10`: Explanations agree with actual scoring contributions.
11. `Scenario 11`: Custom weights and thresholds behave predictably.
12. `Scenario 12`: Duplicate event ingestion is strictly idempotent.
13. `Scenario 13`: Analyst case decisions persist across reloads.
14. `Scenario 14`: Verification outcomes update cases properly without assuming handoff on inconclusive checks.
15. `Scenario 15`: Important decisions generate immutable audit records.
16. `Evaluation Benchmark`: Held-out dataset precision, recall, FPR, and P95 latency under 200 ms.

---

## 9. Session Simulator Demo Instructions

The interactive Session Simulator is the centerpiece demo feature:

1. Open the dashboard at [http://localhost:3000](http://localhost:3000).
2. Click on the **Simulator** tab in the navigation bar.
3. Select **Scenario 6: Possible Account Handoff (Same Phone, Same City)**.
   - Note the scenario details: The rider ID (`RDR-8021`), device identifier (`DEV-SM-A53`), city (`Bengaluru`), and zone (`Koramangala`) remain completely identical.
   - However, the inter-action timing slows from 14.5s to 56.8s (a $13\sigma$ deviation), order acceptance drops to 41%, and a rapid re-login was observed.
4. Click **Run Scenario Pipeline**.
5. Observe the live server output:
   - Evaluated in `< 5ms`.
   - Score: `57/100` (`MEDIUM RISK`).
   - Recommended Action: `STEP-UP VERIFY`.
   - Auto-generated Case: `CASE-2026-0106`.
   - Category Breakdown shows Device & Location scores are `0`, while Behavioral and Session/Account scores triggered the escalation.
6. Click **View Case** to inspect the case in the Review Queue.
7. In the Review modal, test recording an analyst decision (e.g. `Dismiss False Positive` or `Confirm Account Handoff`), enter justification notes, and save.

---

## 10. Measured Evaluation Metrics

Evaluated across the 15 held-out synthetic test scenarios:

| Metric | Measured Result | Benchmark Target | Status |
|---|---|---|---|
| **Recall (Detection Rate)** | **83.3% – 100%** | $\ge 80\%$ | **PASS** |
| **Precision** | **100%** | $\ge 85\%$ | **PASS** |
| **False Positive Rate (FPR)** | **0.0%** | $\le 10\%$ | **PASS** |
| **Verification Challenge Rate** | **33.3%** | $\le 40\%$ | **PASS** |
| **P95 Scoring Latency** | **0.04 ms** | $\le 200\text{ ms}$ | **PASS (5000x faster)** |
| **F1 Score** | **90.9%** | $\ge 85\%$ | **PASS** |

*Note: Evaluation metrics are derived from our deterministic synthetic evaluation suite and demonstrate prototype algorithmic properties.*

---

## 11. Privacy, Safeguards, and Fairness Principles

1. **No Sensitive Document / Aadhaar Collection:**
   TrueRide does not collect Aadhaar numbers, biometric XML files, or national ID images.
2. **In-Memory Biometric Processing:**
   When step-up camera verification is performed, webcam frames are processed in volatile memory for embedding distance calculation and immediately discarded. Raw facial imagery is never written to disk or audit logs.
3. **Evidence Quality Separation:**
   Riders with sparse history (e.g. Rahul Verma, 2 deliveries) are marked as `Evidence Quality: INSUFFICIENT`. Missing data is never treated as evidence of guilt.
4. **No Automated Permanent Bans:**
   A high risk score or inconclusive verification check triggers review or fallback verification—never an automatic permanent account ban.
5. **Baseline Protection from False Positives:**
   When an analyst marks a case as `Dismissed Alert` (e.g. rain screen moisture causing touch delays), the session is excluded from baseline corruption and does not penalize future shifts.

---

## 12. Known Limitations

- **Synthetic Training Data:** Baseline profiles and session events in this hackathon MVP use synthetic distributions representing delivery operations in Bengaluru. Real-world fleet deployment would calibrate thresholds against platform telemetry.
- **Client-Side Camera Fallback:** Live camera verification uses browser WebRTC `getUserMedia`. When running headless or in restricted sandboxes, built-in synthetic outcomes provide complete testability.
- **Single-Node Deployment:** Built on SQLite for zero-config local evaluation; enterprise production would interface with PostgreSQL / Kafka event streams.

---

## 13. License
MIT License. Built for the Hackathon Problem Statement *"The Rented Account Problem"*.
