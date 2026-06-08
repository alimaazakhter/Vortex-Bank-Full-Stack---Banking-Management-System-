# Vortex Bank — Enterprise Fintech SaaS & Full-Stack Banking Management System

Vortex Bank is a premium, high-fidelity Fintech Software-as-a-Service (SaaS) web application designed to deliver modern digital banking services. Engineered with a Next.js App Router frontend, a serverless Prisma-managed PostgreSQL backend, and a dynamic financial analytics engine, Vortex Bank provides users with virtual card issuance, interactive budget limit controls, automated savings stashes, secure transfers, and automated AI-powered spending insights.

---

## 📖 Table of Contents
1. [Evolution: Python CLI (V1) to Next.js Web App (V2)](#1-evolution-python-cli-v1-to-next-js-web-app-v2)
2. [Database Architecture: SQLite to Neon PostgreSQL](#2-database-architecture-sqlite-to-neon-postgresql)
3. [Core Product Features & Implementation](#3-core-product-features--implementation)
4. [Heuristic AI & Financial Insights Engine](#4-heuristic-ai--financial-insights-engine)
5. [Next.js API Route Specifications (REST Architecture)](#5-next-js-api-route-specifications-rest-architecture)
6. [Tech Stack & Security Foundations](#6-tech-stack--security-foundations)
7. [Local Setup & Deployment Instructions](#7-local-setup--deployment-instructions)

---

## 1. Evolution: Python CLI (V1) to Next.js Web App (V2)

Vortex Bank began as a fundamental terminal-based application and evolved into an enterprise-grade web interface.

```mermaid
graph TD
    A[Python CLI V1] -->|Abstract Interface ABC| B[JSON File Database data.json]
    A -->|CLI Banking Menu| C[User age & PIN validation]
    D[Next.js SaaS V2] -->|Prisma 7 ORM| E[Neon.tech Serverless PostgreSQL]
    D -->|Responsive Dashboard UI| F[Visual Analytics Recharts]
    D -->|Multi-card / multi-stash| G[AI Spending Heuristics]
```

### Version 1.0 (Python Command Line Application)
The legacy CLI version ([python-app/Bank.py](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/python-app/Bank.py)) was built to demonstrate object-oriented design and SOLID principles:
- **Strict Interface Boundary**: Enforced core operations (Account Creation, Deposits, Withdrawals, Details, Account Deletion) using a Python Abstract Base Class (`BankInterface` inheriting from `ABC`).
- **File Persistence**: Saved user account records to a local JSON file (`data.json`) which acted as a lightweight database.
- **Account Number Generation**: Developed a legacy alphanumeric system generating a shuffled 7-character account identifier consisting of 3 random letters, 3 random digits, and 1 random symbol (`!@#$`).
- **Validations**: Enforced age constraints ($\ge 18$) and 4-digit transaction PIN validation logic directly in terminal prompts.

### Version 2.0 (Full-Stack Next.js Web Application)
The application was re-architected to a modern Fintech web portal:
- **Interactive Multi-Tenant System**: Migrated from a single-user shell to a secure, multi-user system using custom authentication, cookie-based session management, and dashboard routes.
- **Visual Analytics**: Upgraded terminal printed printouts to an interactive UI using **Recharts** for visual spending insights.
- **Micro-interactions & Aesthetics**: Designed with glassmorphic cards, smooth transitions, dynamic theme preferences (Dark/Light mode), and responsive layout components.

---

## 2. Database Architecture: SQLite to Neon PostgreSQL

To support high performance and database persistence in serverless environments like Vercel, the backend database was migrated from local SQLite to serverless cloud PostgreSQL.

```mermaid
sequenceDiagram
    participant App as Next.js Web App
    participant DB as Prisma Client ORM
    participant SQLite as Local dev.db (SQLite)
    participant Neon as Neon.tech (PostgreSQL)
    
    Note over App,SQLite: Development Phase
    App->>DB: Database Query
    DB->>SQLite: sqlite-adapter (better-sqlite3)
    SQLite-->>DB: Local Data Response
    
    Note over App,Neon: Production Migration (Prisma 7)
    App->>DB: Database Query (via pg-pool)
    DB->>Neon: PrismaPg adapter (SSL Require)
    Neon-->>DB: Cloud Data Response
```

### Phase 1: SQLite (Development Prototyping)
During initial development, a local SQLite instance (`dev.db`) was configured:
- Instantiated using Prisma ORM with `@prisma/adapter-better-sqlite3` and the `better-sqlite3` driver.
- Read/write operations were performed directly on a local file database, making it ideal for offline testing.

### Phase 2: Neon.tech serverless PostgreSQL (Production Cloud Migration)
Serverless hosting (such as Vercel) does not support persistent local file writing. To allow deployment, we migrated to **Neon.tech (Serverless Postgres)**:
- **Prisma 7 Compatibility**: Updated [schema.prisma](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/prisma/schema.prisma) to use the `postgresql` provider. Under Prisma 7 rules, connection URLs are moved out of the schema file and handled dynamically in [prisma.config.ts](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/prisma.config.ts) for improved migration path mapping.
- **PrismaPg Driver Adapter**: Installed `pg` and `@prisma/adapter-pg`. Initialized the connection inside [db.ts](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/src/lib/db.ts) using a standard connection `Pool` over SSL (`sslmode=require`) to prevent connection exhaustion in serverless environments.
- **Database Seeding**: Updated [seed.ts](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/prisma/seed.ts) to populate initial mock user accounts, credit cards, savings pots, and notification logs on the cloud PostgreSQL database.

---

## 3. Core Product Features & Implementation

### A. Virtual Card Manager
Users can instantiate and manage multiple virtual credit/debit cards on-demand.
- **Random Card Numbers**: Generates 16-digit cards starting with 4 (Visa) or 5 (Mastercard), random 3-digit CVV, and expiration dates set 4 years in the future using [utils.ts](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/src/lib/utils.ts).
- **Status Toggling**: Cards can be dynamically frozen or active. A frozen card rejects any simulated purchase attempts.
- **Spending Limits**: Users can set custom transaction thresholds to restrict high-volume outflows.

### B. Intelligent Savings Pots
A dedicated wealth-building section that isolates savings from main account balances.
- **Goal-Driven Stashes**: Users define custom savings pots (e.g., "Emergency Fund", "Dream Car") with specific target values.
- **Isolate Balances**: Money can be manually deposited or withdrawn between the user's primary checking balance and these pots. These transactions are logged under `SAVINGS_CONTRIBUTION` and `SAVINGS_WITHDRAWAL` transaction categories.

### C. Category Budgeting & Visualizations
Allows users to set hard limits on monthly expenses across categories: `SHOPPING`, `FOOD`, `TRAVEL`, `ENTERTAINMENT`, `BILLS`, and `HEALTHCARE`.
- **Progress Gauges**: Dynamically overlays actual monthly expenses against configured limits.
- **Visual Charts**: Uses Recharts to render color-coded doughnut charts, area progress bars, and historical spending comparisons.

### D. Multi-Party Transfers & Core Ledgers
- **Inter-Bank Transfers**: Transfers money in real-time between user accounts by inputting the recipient's unique 7-character alphanumeric account number (e.g. `@1Ct9B8`).
- **PIN Verification**: All outflows (withdrawals, external transfers) require verification of the user's 4-digit transaction PIN to validate the transfer.

---

## 4. Heuristic AI & Financial Insights Engine

The application includes an **AI Insights Engine** ([AIInsightsClient.tsx](file:///c:/Users/alimo/OneDrive/Desktop/Bank%20Management%20System%20%28WEB%20APP%29/src/components/AIInsightsClient.tsx)) that parses user transactions to offer real-time, actionable spending recommendations.

```
[Transaction Ledger] ──> [Filter Current Month] ──> [AI Insights Parser]
                                                          │
   ┌──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┐
   ▼                                                      ▼                                                      ▼
[Category Check]                                  [Volatility Spike]                                     [Savings Audit]
Evaluates spent amount                            Compares overall outflows                              Audits monthly savings
against interactive sliders.                      month-over-month (MoM).                                contribution records.
• Over Limit: "Freeze Card"                       • Spike > 15%: "Check subs"                            • Zero: "Start auto-save"
• Warn > 80%: "Remaining: Rs. X"                  • Reduction: "Wealth growth tip"                       • Positive: "Keep it up"
```

- **Interactive Budget Simulator**: Contains slider controls representing target budgets. Adjusting these sliders updates the advisor engine instantly in the browser without reloading the page.
- **Actionable Advice Cards**: Renders three distinct card states based on spending behaviors:
  1. **Alert (Critical Red)**: Triggers when category thresholds are exceeded, advising users to freeze virtual cards associated with that category.
  2. **Warning (Amber)**: Triggers when category outflows reach 80% to 100% of the threshold, showing the remaining budget.
  3. **Success (Green)**: Triggers when spending is well within limits, or if monthly expenses are reduced month-over-month.

---

## 5. Next.js API Route Specifications (REST Architecture)

The application communicates via serverless API routes using JSON payloads:

### Authentication (`/api/auth`)
*   `POST /api/auth/register`: Creates a new user in the database. Hashes the password using `bcryptjs`, generates a random 7-character account number, and establishes standard dark-mode and notification defaults.
*   `POST /api/auth/login`: Validates the username and password against the database hash. Sets a secure session cookie on success.
*   `POST /api/auth/logout`: Clears the session cookie.
*   `POST /api/auth/reset-password`: Verifies current credentials and updates the password hash.

### Accounts & User Profiles (`/api/user`)
*   `POST /api/user/update`:
    *   `action: "update_details"`: Updates the user's name, email, and avatar path (such as `/avatars/avatar-4.svg`).
    *   `action: "change_password"`: Verifies current password and updates the hash.
    *   `action: "change_pin"`: Validates and saves a new 4-digit transaction PIN.
*   `POST /api/user/preferences`: Updates user theme preference (`LIGHT` or `DARK`) and notification flags.

### Virtual Cards (`/api/cards`)
*   `POST /api/cards/create`: Generates a new virtual card (card number, expiration date, CVV, spending limit) linked to the user account.
*   `POST /api/cards/toggle`: Alternates card state between `ACTIVE` and `FROZEN`.
*   `POST /api/cards/update`: Adjusts the card's maximum spending limit.
*   `POST /api/cards/delete`: Deletes the virtual card.
*   `POST /api/cards/simulate-transaction`: Simulates a purchase. Validates that the card is not frozen, checks if the amount is within the card limit, checks user balance, processes the deduction, and logs the transaction.

### Savings Pots (`/api/savings`)
*   `POST /api/savings/create`: Instantiates a new savings stash with target goals.
*   `POST /api/savings/deposit`: Deposits checking funds into the stash. Logs a `SAVINGS_CONTRIBUTION` transaction.
*   `POST /api/savings/withdraw`: Withdraws funds back to checking. Logs a `SAVINGS_WITHDRAWAL` transaction.
*   `POST /api/savings/delete`: Deletes the stash and returns its balance back to primary checking.

### Transactions (`/api/transaction`)
*   `POST /api/transaction/deposit`: Credits money to primary checking.
*   `POST /api/transaction/withdraw`: Debits money from checking after verifying the transaction PIN.
*   `POST /api/transaction/transfer`: Debits checking, credits recipient checking, logs transfer history on both sender and recipient ledgers. Requires a valid recipient account number and transaction PIN.

---

## 6. Tech Stack & Security Foundations

- **Next.js 16 (App Router)**: Frontend layouts and serverless API endpoints.
- **Tailwind CSS v4 & Vanilla CSS Modules**: Combined styling utility system for layout design.
- **Prisma 7 (ORM)**: Type-safe database queries.
- **Database Client Adapter**: `@prisma/adapter-pg` coupled with `pg` connection pool.
- **Recharts**: Responsive SVG graphs for budget visualizations.
- **BCryptJS**: 10-round salted password hashing.
- **Session Security**: Cookie-based server-side HTTP-only session tokens to prevent cross-site scripting (XSS) attacks.

---

## 7. Local Setup & Deployment Instructions

### Prerequisites
- Node.js (version 18 or higher recommended)
- A PostgreSQL database instance (local or hosted on Neon.tech)

### 1. Installation
Clone your repository locally and install the dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and add your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"
```

### 3. Generate Database Client
Sync the database schemas and compile the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

### 4. Seed Database (Optional)
Seed the database with initial configurations, test user credentials, and transaction logs:
```bash
npx tsx prisma/seed.ts
```

### 5. Running the Development Server
Launch the local dev server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

### 6. Deployment on Vercel
1. Push your code to your GitHub repository.
2. Link your repository in the Vercel Dashboard.
3. Add the `DATABASE_URL` environment variable under Vercel project configurations.
4. Click **Deploy**. Vercel will automatically build and publish the live site.
