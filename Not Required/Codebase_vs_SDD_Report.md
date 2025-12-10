# Codebase vs. Software Design Document (SDD) Analysis Report

**Date:** 2025-12-09
**Subject:** Verification of Current Codebase against "M13 Assignment- Submit Software Design Document 1.md"

## 1. Executive Summary

The current codebase is a **modernized, more advanced evolution** of the system described in the Software Design Document (SDD).

While the core business logic (calculating overlaps, gaps, and recommendations) remains faithful to the algorithms described in the SDD, the **technical architecture** has been significantly streamlined (moving from a 3-tier Python/JS split to a unified Next.js Full Stack), and **major new features** (AI/RAG, Chat) have been added that were not in the original specification.

**Opinion:** The **Current Codebase** is the superior version. It reduces infrastructure complexity by unifying the stack and adds high-value AI capabilities that significantly enhance the user value beyond simple static recommendations.

---

## 2. Architectural Comparison

| Feature | SDD Specification | Current Codebase | Status |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js + React | Next.js 16 + React 19 | ✅ **Match** (Updated Versions) |
| **Backend** | Flask (Python) Monolith | Next.js Server Actions (TypeScript) | ⚠️ **Available** (Architecture changed) |
| **Database** | Supabase (PostgreSQL) | Neon (PostgreSQL) + Prisma ORM | ✅ **Equivalent** (Both are Cloud Postgres) |
| **Language** | Polyglot (JS Frontend, Python Backend) | Monorepo / Single Language (TypeScript) | ⚠️ **Changed** (Unified) |
| **Data Fallback** | JSON Files | JSON Files (`/lib/data`) | ✅ **Match** |
| **AI / Machine Learning** | Not Mentioned | RAG (Pinecone + Google Gemini) | 🆕 **New Feature** |

### Key Differences:
1.  **Unified Stack (Next.js Server Actions):** The SDD describes a "Tier 2" Flask application. The codebase has replaced this with Next.js Server Actions (`app/actions/`). This is a positive change, eliminating the need to manage two separate servers and runtimes, providing better type safety and simpler deployment.
2.  **ORM Usage:** The codebase uses **Prisma**, which provides safer database access than raw SQL or simple Flask connectors.
3.  **AI Integration:** The presence of `lib/rag` (Retrieval Augmented Generation) indicates a sophisticated "Ask Data" or "Advising Assistant" feature that goes far beyond the SDD's functional scope.

---

## 3. Feature Verification

### 3.1. Core Recommendation Engine
*   **SDD Requirement:** Calculate "Gap Credits," "Overlap," and "Triple Dips."
*   **Codebase Evidence:**
    *   File: `app/actions/getRecommendations.ts`
    *   Functions: `getMinorRecommendations`, `auditRequirement`, `calculateStrategicScore`.
    *   **Verdict:** ✅ **MATCH**. The logic for analyzing transcripts against major/minor requirements is implemented as designed.

### 3.2. Data Inputs
*   **SDD Requirement:** Enter Academic Info (Major + Courses) & Upload PDF.
*   **Codebase Evidence:**
    *   File: `app/actions/parseTranscript.ts` imports `pdf-parse`.
    *   File: `app/actions/getRecommendations.ts` accepts `parsedCourses`.
    *   **Verdict:** ✅ **MATCH**. PDF parsing and manual input flow are present.

### 3.3. General Education (GenEd)
*   **SDD Requirement:** "Find Triple dip opportunities" and GenEd planning.
*   **Codebase Evidence:**
    *   Directory: `app/gened/`
    *   File: `app/actions/getGenEdRequirements.ts`
    *   **Verdict:** ✅ **MATCH**. GenEd planning is a distinct feature in the codebase.

### 3.4. Chat / AI Advisor
*   **SDD Requirement:** None.
*   **Codebase Evidence:**
    *   Directory: `app/chat/`
    *   Library: `lib/rag/` (Pinecone, Gemini)
    *   **Verdict:** 🆕 **BONUS FEATURE**. This exceeds specificiations.

---

## 4. Discrepancies & Recommendations

### Discrepancy 1: Backend Implementation
*   **Observation:** The SDD explicitly diagrams a Flask backend. The codebase has none.
*   **Impact:** The architecture diagram in the SDD is obsolete.
*   **Action:** Update documentation to reflect "Serverless Functions / Server Actions" architecture instead of "Monolithic Flask Server."

### Discrepancy 2: Database Provider
*   **Observation:** SDD says Supabase; Codebase uses Neon.
*   **Impact:** Negligible. Both are excellent serverless Postgres providers.
*   **Action:** No action needed, but documentation should specify "PostgreSQL" generically or update to Neon.

### Discrepancy 3: Course Data Status
*   **Observation:** Codebase relies heavily on local JSONs in `lib/data` for definitions (Majors/Minors).
*   **Impact:** SDD mentions this as a fallback. It appears to be the primary driver currently, with DB strictly for vector/RAG or user data?
*   **Action:** Ensure the synchronization strategy mentioned in SDD (loading JSON to DB) is actually implemented if the DB is intended to be the source of truth.

---

## 5. Conclusion: Which is "Best"?

**The Present Codebase is Best.**

The shift from a split Python/JS architecture to a unified TypeScript stack represents a significant maturity in engineering strategy. It reduces the "bus factor" (developers needing to know two ecosystems), simplifies deployment (Vercel-ready), and allows for end-to-end type safety.

Furthermore, the inclusion of the **RAG (AI) Engine** modernizes the application from a simple calculator to an intelligent assistant, which aligns better with the user goal of "helping students make better decisions" than a static rule engine ever could.
