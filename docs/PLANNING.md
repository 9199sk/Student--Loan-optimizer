# Project Planning & Architecture Document

## 1. Development Plan & Strategy

The **Student Loan EMI & Prepayment Optimizer** was developed following a modular, phase-based architecture to guarantee high precision, clean separation of concerns, and maximum performance.

### Key Architectural Principles
1. **Decoupled Financial Engine**: All loan formulas reside in pure JavaScript utility functions without DOM, React, or database dependencies.
2. **Instant Local Reactivity**: All calculations run locally in the browser upon input change, providing 0ms latency feedback.
3. **Persisted Strategy Vault**: Users can save calculation states to a MongoDB database and reload them for comparison.
4. **Professional Output**: Results can be exported as a printable PDF report using client-side PDF compilation.

---

## 2. System Architecture & Component Mapping

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (React 19 + Vite)                   │
├───────────────────────────────┬─────────────────────────────────┤
│ UI Components                 │ State & Logic                   │
│ - Navbar & Mobile Drawer      │ - AuthContext                   │
│ - DashboardHero               │ - useLoanCalculator Hook        │
│ - LoanInputForm               │ - loanCalculations Engine       │
│ - PrepaymentSimulator         │ - chartData Transformer         │
│ - LoanSummaryCards            │ - pdfGenerator Utility          │
│ - Recharts Analytics          │ - Axios API Layer               │
│ - AmortizationTable           │                                 │
└───────────────────────────────┴─────────────────────────────────┘
                                │
                                │ REST API (Bearer JWT)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server (Node.js + Express)                   │
├───────────────────────────────┬─────────────────────────────────┤
│ Middlewares                   │ Controllers & Models            │
│ - Auth Middleware (protect)   │ - Auth Controller               │
│ - CORS & Express Validator    │ - Scenario Controller           │
│ - Global Error Handler        │ - User & Scenario Schemas       │
└───────────────────────────────┴─────────────────────────────────┘
                                │
                                │ Mongoose ORM
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MongoDB Atlas (Database)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Modules & Responsibilities

| Module | File Location | Responsibility |
| :--- | :--- | :--- |
| **Financial Calculation Engine** | `client/src/utils/loanCalculations.js` | EMI calculation, moratorium interest capitalization, month-by-month prepayment simulation, and savings computation. |
| **Chart Data Transformer** | `client/src/utils/chartData.js` | Transforms raw schedule data arrays into dataset series for Recharts line, bar, and area charts. |
| **PDF Roadmap Generator** | `client/src/utils/pdfGenerator.js` | Compiles loan summaries, prepayment strategies, savings metrics, and multi-page amortization tables into PDF reports. |
| **Calculator Hook** | `client/src/hooks/useLoanCalculator.js` | Manages input form state, prepayment parameters, input sanitization, and engine invocation. |
| **Authentication System** | `server/controllers/auth.controller.js` | Manages user registration, bcrypt password hashing, login verification, and JWT generation. |
| **Scenario Manager API** | `server/controllers/scenario.controller.js` | Handles user-owned scenario CRUD operations. |

---

## 4. Phase-by-Phase Milestones

- **Phase 1: Project Setup & Layout**: Established React/Vite client and Express server scaffolding with Tailwind CSS.
- **Phase 2: Financial Calculation Engine**: Developed `loanCalculations.js` with pure JS functions for EMI, moratorium, and prepayment math.
- **Phase 3: Interactive Dashboard UI**: Created `LoanInputForm`, `LoanSummaryCards`, `SavingsBanner`, and `AmortizationTable`.
- **Phase 4: Prepayment Simulator**: Implemented interactive sliders, quick presets, and lump-sum payment parameters.
- **Phase 5: Financial Visualization**: Integrated Recharts for remaining balance, EMI composition, and cumulative interest charts.
- **Phase 6: User Authentication & Database**: Built MongoDB Atlas models, JWT authentication middleware, and scenario endpoints.
- **Phase 7: Save & Compare Scenarios**: Created `SavedScenariosPage` and modal dialog for saving and loading scenarios.
- **Phase 8: Downloadable PDF Roadmap**: Implemented client-side PDF generation using `jsPDF` and `jspdf-autotable`.
- **Phase 9: Final UI/UX Polish**: Enhanced visual hierarchy, mobile drawer navigation, loading states, empty states, and toast notifications.
- **Phase 10: Production Deployment**: Configured Vercel frontend, Render backend, MongoDB Atlas network access, and CORS settings.
