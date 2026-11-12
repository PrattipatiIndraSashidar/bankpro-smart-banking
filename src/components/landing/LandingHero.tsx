import React from 'react';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Database,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Server
} from 'lucide-react';

interface LandingHeroProps {
  onQuickLogin: (role: UserRole, id: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigateSql: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onQuickLogin,
  onOpenAuth,
  onNavigateSql,
}) => {
  return (
    <div className="space-y-16 py-6">
      {/* Hero Header Section */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 lg:p-16 border border-slate-800 relative overflow-hidden shadow-xl">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>BankPro Enterprise Core Banking Suite</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
            High-Integrity Banking with ACID Double-Entry Ledger
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Engineered with strict Microsoft SQL Server transaction isolation, real-time balance reservations, role-based controls for Admins and Tellers, and customer financial telemetry.
          </p>

          {/* Persona Launchpad */}
          <div className="pt-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Launch Direct Demo Portals
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onQuickLogin('CUSTOMER', '1001')}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-blue-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">Customer Portal</span>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  Alice Henderson · $15,500 Bal
                </div>
              </button>

              <button
                onClick={() => onQuickLogin('EMPLOYEE', '502')}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">Teller Counter</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  David Miller · Cash Desk Ops
                </div>
              </button>

              <button
                onClick={() => onQuickLogin('ADMIN', '501')}
                className="p-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-rose-500 text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">Admin Console</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  Sarah Connor · Risk & Liquidity
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 font-display">
            Built for Scalability, Compliance & Security
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Every layer from database stored procedures to front-end accounting respects financial invariants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              Atomic P2P Double Entry
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dual-leg debit and credit ledger posting. Deterministic lock acquisition prevents concurrency deadlocks and partial transfers.
            </p>
            <div className="text-[11px] font-mono text-blue-700 font-semibold pt-1">
              usp_ExecuteTransfer with UPDLOCK
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              SQL Server 2022 Schemas
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              3NF relational tables, check constraints against negative balances, CTE window rank queries, and automated trigger-based audit logging.
            </p>
            <button
              onClick={onNavigateSql}
              className="text-[11px] font-mono text-emerald-700 font-semibold pt-1 hover:underline flex items-center gap-1"
            >
              <span>Explore T-SQL Scripts & Schema →</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              AML & Risk Enforcement
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated threshold detection for transactions &ge; $10,000, administrative freeze capabilities, and complete immutable session audit logs.
            </p>
            <div className="text-[11px] font-mono text-rose-700 font-semibold pt-1">
              FINCEN & Suspicious Volume Flagging
            </div>
          </div>
        </div>
      </section>

      {/* Account Types Comparison Strip */}
      <section className="bg-white border border-slate-200 rounded-xl p-8">
        <h3 className="font-bold text-lg text-slate-900 font-display mb-6 text-center">
          Available Account Tiers & Minimum Balance Constraints
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="border border-slate-200 rounded-xl p-6 space-y-4 bg-slate-50/50">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Retail Banking</span>
                <h4 className="text-xl font-bold text-slate-900 font-display">Savings Account</h4>
              </div>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                $500 Min Reserve
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interest-yielding retail account designed for personal liquidity with strict hardware-enforced reserve rules.
            </p>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Withdrawal rejection if balance drops below $500.00</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Automated monthly interest capitalization accrual</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant P2P transfers & downloadable PDF statements</span>
              </li>
            </ul>
          </div>

          <div className="border border-slate-200 rounded-xl p-6 space-y-4 bg-slate-50/50">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Commercial Banking</span>
                <h4 className="text-xl font-bold text-slate-900 font-display">Current Account</h4>
              </div>
              <span className="text-xs font-mono bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                $0 Min Reserve
              </span>
            </div>
            <p className="text-xs text-slate-500">
              High-velocity operational checking account for merchants, businesses, and routine corporate payroll disbursements.
            </p>
            <ul className="text-xs space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero minimum balance floor restriction ($0.00 permitted)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>High daily volume transfer thresholds up to $50,000.00</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-beneficiary batch settlements & counter operations</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};
