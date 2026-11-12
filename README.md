# BANKPRO – Smart Banking Management System

An enterprise-grade, full-stack Banking Management System featuring multi-role access control, double-entry ACID banking transactions, interactive T-SQL workbench with Microsoft SQL Server scripts, and customer analytics powered by Recharts.

---

## 🚀 Key Highlights & Features

### 1. Multi-Role Banking Portals
- **👑 Admin Portal**:
  - Bank liquidity overview and total capital reserves.
  - Customer account application approval/rejection queue.
  - Account freeze and unfreeze controls.
  - Employee lifecycle management.
  - Anti-Money Laundering (AML) monitoring for transactions $\ge \$10,000$.
- **👔 Bank Employee / Teller Desk**:
  - Fast KYC customer onboarding.
  - Walk-in counter cash desk for direct deposits and withdrawals.
  - Instant account opening and customer verification.
- **👤 Customer Dashboard**:
  - Real-time balance and transaction stream.
  - Quick deposit and withdrawal modal with balance checks.
  - Beneficiary management and inter-account transfers.
  - Downloadable official statements (CSV & print-ready statements).

### 2. 📊 Interactive Spending Trends (Powered by Recharts)
- **Monthly Outflows by Tag**: Visualizes spending patterns categorized by tags (`Rent`, `Utilities`, `Groceries`, `Dining`, `Transport`, `Shopping`, `Healthcare`).
- **Multiple Visual Modes**:
  - **Stacked Monthly Bar Chart**: View spending progression across months.
  - **Category Share Donut**: Proportional distribution with central summary metrics.
  - **Trajectory Area Chart**: Smooth trendline of outflow volume over time.
- **Customized Precision Tooltips**: Formatted dollar amounts, category icons, month tags, and percentage share.
- **Dynamic Legend**: Interactive toggle to trace or isolate specific spending categories.
- **Categorized Outflow Journal**: Filterable transaction log with running balances.

### 3. 🗄️ Microsoft SQL Server & T-SQL Studio
- **Script Explorer**:
  - `01_create_database.sql`: Database initialization & configurations.
  - `02_create_tables.sql`: DDL for Customers, Accounts, Transactions, Transfers, Beneficiaries, AuditLogs, and BankSettings.
  - `03_stored_procedures.sql`: ACID procedures for deposit, withdrawal, and transfer with `TRY...CATCH` and `ROWLOCK`.
  - `04_views.sql`: Account summary and transaction reporting views.
  - `05_triggers.sql`: Automated audit log triggers on balance changes.
  - `06_sample_data.sql`: Seed dataset with realistic banking history.
- **Interactive Query Console**:
  - Live execution of complex T-SQL queries (`INNER JOIN`, `LEFT JOIN`, CTEs, `DENSE_RANK()`, `ROW_NUMBER()`).
- **Interactive ER Diagram**: Visual relationship model of database tables and foreign keys.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Chart.js, Motion.
- **Backend / Engine**: Express, TypeScript, In-Memory & LocalStorage Persistent ACID Ledger.
- **Database Modeling**: Microsoft SQL Server (T-SQL scripts, stored procedures, constraints, indexes).

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/PrattipatiIndraSashidar/<your-repo-name>.git

# Navigate into the project folder
cd <your-repo-name>

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🔐 Default Demo Accounts

| Role | Name | Identifier | Access Level |
|---|---|---|---|
| **Customer** | Alice Henderson | Account #1001 | Personal Banking & Spending Trends |
| **Customer** | Bob Alexander | Account #1002 | Personal Banking & Transfers |
| **Employee** | David Miller | ID: EMP-001 | Customer KYC, Counter Deposits/Withdrawals |
| **Admin** | Sarah Connor | ID: ADM-001 | Liquidity, Approvals, AML Monitoring, Audits |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
