import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import {
  Building2,
  UserCheck,
  LogOut,
  ChevronDown,
  Database,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  FileSpreadsheet,
  LayoutDashboard,
  TrendingDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string) => void;
  onSwitchUser: (role: UserRole, id: string) => void;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onSwitchUser,
  onLogout,
  onOpenAuth,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-blue-400 transition-colors whitespace-nowrap shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="font-display">BankPro</span>
          </button>

          {currentUser && (
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 hidden sm:inline-block">
              {currentUser.role}
            </span>
          )}
        </div>

        {/* Zone 2: Navigation Links (single-line, concise) */}
        {currentUser ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'dashboard' ? 'text-white font-semibold' : ''
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {currentUser.role === 'CUSTOMER' && (
              <>
                <button
                  onClick={() => onNavigate('deposit')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'deposit' ? 'text-white font-semibold' : ''
                  }`}
                >
                  <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={() => onNavigate('withdraw')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'withdraw' ? 'text-white font-semibold' : ''
                  }`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Withdraw</span>
                </button>
                <button
                  onClick={() => onNavigate('transfer')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'transfer' ? 'text-white font-semibold' : ''
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Transfer</span>
                </button>
                <button
                  onClick={() => onNavigate('statement')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'statement' ? 'text-white font-semibold' : ''
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Statements</span>
                </button>
                <button
                  onClick={() => onNavigate('spending')}
                  className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'spending' ? 'text-white font-semibold' : ''
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                  <span>Spending Trends</span>
                </button>
              </>
            )}

            <button
              onClick={() => onNavigate('sql')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'sql' ? 'text-white font-semibold' : ''
              }`}
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQL Studio</span>
            </button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('features')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Architecture
            </button>
            <button
              onClick={() => onNavigate('sql')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQL Server Scripts</span>
            </button>
          </nav>
        )}

        {/* Zone 3: Primary Actions & Persona Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* Demo Quick Persona Selector */}
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap shrink-0"
                  title="Switch Demo Role (Admin / Teller / Customer)"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline font-sans">{currentUser.fullName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Persona Switcher Dropdown */}
              {showPersonaMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 text-xs"
                  onMouseLeave={() => setShowPersonaMenu(false)}
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Switch Demo Persona (1-Click)
                  </div>

                  <button
                    onClick={() => {
                      onSwitchUser('CUSTOMER', '1001');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Alice Henderson (Customer)</div>
                      <div className="text-slate-500 text-[11px]">Primary Savings: BPRO10010001 ($15,500)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUser('CUSTOMER', '1002');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Bob Alexander (Customer)</div>
                      <div className="text-slate-500 text-[11px]">Current Account: BPRO10020002 ($4,200)</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUser('EMPLOYEE', '502');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">David Miller (Bank Teller)</div>
                      <div className="text-slate-500 text-[11px]">Branch Operations & Customer Service</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSwitchUser('ADMIN', '501');
                      setShowPersonaMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-600 mt-1 shrink-0" />
                    <div>
                      <div className="font-semibold text-slate-900">Sarah Connor (System Admin)</div>
                      <div className="text-slate-500 text-[11px]">Security, Approvals & Liquidity KPIs</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                Open Account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
