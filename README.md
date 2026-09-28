# Gold & Silver Jewellery ERP — Discount Engine

> **Production-Ready Enterprise Web Application**  
> Built with Next.js 14 (App Router), TypeScript, PostgreSQL 16, Prisma ORM, Tailwind CSS, and Vitest.  
> Adheres strictly to the **Discount Engine — Functional & Technical Requirements** specification.

---

## 🌟 Executive Overview

The **Gold & Silver Jewellery ERP Discount Engine** is a high-precision, component-isolated discount calculation and policy governance system designed for multi-branch retail and wholesale jewellery operations.

Unlike generic retail discount calculators, jewellery pricing involves distinct cost components (Metal Value, Making Charges, Wastage, Stone Value, Hallmarking, and Certification). This Discount Engine guarantees that:
1. **Component Isolation**: Making charge discounts apply strictly to Making Charges; Metal Value remains untouched unless explicitly configured.
2. **Deterministic Precedence**: Stacking modes (`STACK`, `HIGHEST`, `SEQUENTIAL`) and priority-tier rules prevent margin erosion.
3. **Conflict Detection**: Equal priority, non-stackable rule collisions trigger an explicit `CONFLICT DETECTED` warning rather than silently guessing.
4. **Server-Side Authority Limits**: Sales Staff (10%), Store Managers (25%), Admins (100%). Over-limit requests are blocked and routed to an Approval Queue.
5. **Immutable Version Auditing**: Historical transactions snapshot rule versions at calculation time; subsequent rule edits never mutate past invoices.

---

## 🏗️ System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │           POS / Billing Terminal             │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                    JSON Transaction Context Payload
                                                      │
                                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           DISCOUNT ENGINE SERVICE                                              │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  1. Rule Matcher (services/discount/matcher.ts)                                                                │
│     ├── Status Check (ACTIVE only, DRAFT/INACTIVE/EXPIRED rejected)                                           │
│     ├── Date & Time Windows (start/end date, start/end time, day-of-week)                                      │
│     ├── Customer Hierarchy (Customer, Tier, Group, Type)                                                       │
│     ├── Product Hierarchy (Article, Article Group, Subcategory, Category, Metal, Purity)                       │
│     └── Threshold Conditions (Min/Max Weight, Min/Max Gross Value, Min/Max Net Value, Min/Max Quantity)        │
│                                                                                                                │
│  2. Conflict Detector (services/discount/conflict.ts)                                                          │
│     └── Flags equal-priority, non-stackable overlapping rules with CONFLICT DETECTED warning                   │
│                                                                                                                │
│  3. Component Calculator (services/discount/calculator.ts)                                                    │
│     ├── PERCENTAGE (on target component only)                                                                  │
│     ├── FIXED_AMOUNT                                                                                           │
│     ├── AMOUNT_PER_GRAM (Net Weight vs Gross Weight basis)                                                     │
│     ├── AMOUNT_PER_PIECE / AMOUNT_PER_CARAT                                                                    │
│     ├── FIXED_PRICE_OVERRIDE                                                                                   │
│     └── Max Discount Limit Cap (₹ or %)                                                                        │
│                                                                                                                │
│  4. Stacking & Priority Engine (services/discount/stacking.ts)                                                 │
│     ├── Sort by Priority DESC (Tier 1 > Tier 2 > Tier 3)                                                       │
│     └── Apply Stacking Mode (STACK, HIGHEST, SEQUENTIAL)                                                       │
│                                                                                                                │
│  5. Permission & Approval Sentinel (services/discount/permissions.ts)                                          │
│     ├── Sales Staff: Max 10%                                                                                   │
│     ├── Manager: Max 25%                                                                                       │
│     └── Admin: Max 100% (Manual discounts exceeding role limits route to Approval Queue)                      │
│                                                                                                                │
│  6. Immutable Audit & Versioning (services/discount/engine.ts)                                                 │
│     └── Snapshots DiscountRuleVersion to DiscountApplication and DiscountApplicationComponent                  │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                      │
                         { lines: [...], totalDiscount, effectiveComponents, auditTrail }
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │       ERP Core Billing & Tax Engine          │
                               └──────────────────────────────────────────────┘
```

---

## 🚀 Key Features Built & Live

| Module | Route | Capabilities |
|---|---|---|
| **Executive Dashboard** | `/` | Live KPI cards (Active Rules, 24h Approvals, 30d Discount ₹, Margin Impact), Rule Usage Leaderboard, Audit Feed, Quick Actions. |
| **Rule Catalog** | `/discount-rules` | Enterprise data table with live search, status filtering, category filters, quick toggle (Activate/Deactivate), Duplicate, and Delete. |
| **Visual Rule Builder** | `/rule-builder` | 6-step wizard: Basic Details, Hierarchy Targeting (Customer & Product), Component Isolation, Logic & Methods, Conditions & Limits, and Stacking/Scheduling. Real-time dynamic Summary Card. |
| **Rule Detail & Versions** | `/discount-rules/[id]` | Full rule breakdown, version evolution log, application stats, and one-click "Test this Rule" in Simulator. |
| **Interactive Simulator** | `/rule-simulator` | Real-time calculation workbench with 1-click jewellery presets, multi-line item builder, component breakdown table, and step-by-step decision tree trace. |
| **Manual Counter Desk** | `/manual-discount` | POS counter interface for ad-hoc discounts with live authority limit checks, justification reason selector, and automatic Manager Approval escalation. |
| **Manager Approval Queue**| `/approvals` | Filterable review queue (Pending, Approved, Rejected) with discount percentage badges, customer context, and one-click Approve/Reject with comments. |
| **Audit Trail & Inspector**| `/audit-trail` | Historical invoice and discount log with searchable invoice IDs and expandable JSON inspection drawer showing exact rule version snapshots. |
| **Rule Version History** | `/rule-versions` | Evolution timeline and snapshot diff viewer showing historical changes, who modified the rule, and version comparisons. |
| **System Settings** | `/settings` | Role authority matrix configuration, component isolation rule matrix, system health, and database connection status. |

---

## 🔑 Demo User Credentials

The system includes pre-seeded accounts representing all 3 enterprise roles. Use the quick switcher in the top navigation bar or log in directly:

| Role | Email | Password | Authority Limit | Approval Rights |
|---|---|---|---|---|
| **System Administrator** | `admin@jewelleryerp.com` | `admin123` | **100%** | Full System & Overrides |
| **Store Manager** | `manager@jewelleryerp.com` | `manager123` | **25%** | Approves Staff Requests |
| **Sales Staff** | `sales@jewelleryerp.com` | `sales123` | **10%** | Requires Approval if > 10% |

---

## 📦 Tech Stack & Database Specifications

- **Framework**: Next.js 14.2.33 (App Router, Server Actions, Dynamic API Routes)
- **Language**: TypeScript 5.4.5 (Strict Mode, Downlevel Iteration)
- **Styling**: Tailwind CSS 3.4.1 (Enterprise Dark/Light Palette, Gold Accent `#D4AF37`)
- **Icons**: Lucide React
- **Database**: PostgreSQL 16 (Relational Schema with 22 models)
- **ORM**: Prisma 5.14.0
- **Testing**: Vitest 1.6.0 (Automated Unit & Integration Test Suite)

---

## 🛠️ Local Setup & Running Instructions

### 1. Prerequisites
- **Node.js**: v18.18.0 or v20+
- **PostgreSQL**: v14+ (or use the built-in isolated local cluster)

### 2. Environment Variables
Create a `.env` file in the root directory (already configured in this repository):
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/jewellery_erp?schema=public"
AUTH_SECRET="jewellery-erp-super-secret-jwt-key-2024"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Initialization & Seeding
If setting up on a fresh machine or new database instance:
```bash
# Push schema to PostgreSQL
npx prisma db push

# Seed preloaded acceptance rules, roles, customers, and jewellery inventory
node prisma/seed.js
```

### 4. Running the Application
```bash
# Development Mode:
npm run dev

# Production Build & Start:
npm run build
npm run start
```
The application will be live at `http://localhost:3000`.

---

## 🧪 Automated Testing Suite

The project includes 15 automated test specifications covering unit logic and live database integration:

```bash
# Run the test suite:
npm run test
```

### Test Coverage Breakdown:
1. `tests/discountEngine.test.ts`:
   - Component isolation (Making Charges discounted; Metal Value completely untouched).
   - Percentage discounts on target components.
   - Fixed amount discounts.
   - Amount per gram (Net Weight vs Gross Weight basis).
   - Maximum discount limit capping.
   - Stacking rules (`STACK`, `HIGHEST`, `SEQUENTIAL`).
   - Equal priority non-stackable conflict detection (`CONFLICT DETECTED`).
2. `tests/databaseIntegration.test.ts`:
   - Live database querying against seeded customers and products.
   - Aisha Patel (VIP Tier) Gold Chain purchase matching **VIP 20% Making Charge Rule**.
   - Vijay Sharma (Wholesale) Silver purchase matching **₹5/gram Silver Rule**.
   - Min gross value threshold evaluation.
3. `tests/versioningAndApprovals.test.ts`:
   - Immutable historical version snapshotting upon rule edit.
   - Manager approval workflow and status transitions (`PENDING` -> `APPROVED`).

---

## ☁️ Deployment to Vercel

The application is fully compatible with Vercel deployment:

1. Push the repository to GitHub/GitLab.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Environment Variables:
   - `DATABASE_URL`: Your hosted PostgreSQL URL (e.g. Supabase, Neon, AWS RDS).
   - `AUTH_SECRET`: A secure random 32-character string.
   - `NEXT_PUBLIC_APP_URL`: Your Vercel production domain.
4. Set Build Command: `npx prisma generate && next build`
5. Deploy!

---

## 📜 Verification Checklist

- [x] Component-level isolation (Making charges, Metal values, Stones, Hallmark).
- [x] All 7 Calculation methods (%, Fixed, Per Gram Net/Gross, Per Piece, Per Carat, Price Override).
- [x] Stacking & Priority tiers (`STACK`, `HIGHEST`, `SEQUENTIAL`).
- [x] Conflict detection on equal-priority non-stackable rules.
- [x] Role-based authority limits (Sales Staff: 10%, Manager: 25%, Admin: 100%).
- [x] Manager Approval Queue with escalation and review.
- [x] Visual Rule Builder with real-time summary card.
- [x] Interactive Rule Simulator with multi-line items and decision traces.
- [x] Immutable version snapshotting & historical audit logs.
- [x] 15/15 Automated tests passing in Vitest.
- [x] Zero TypeScript errors, production build verified.
