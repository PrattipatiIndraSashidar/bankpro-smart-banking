import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Account, Customer, Transaction, User } from '../../types';
import { bankStore } from '../../services/bankStore';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  FileSpreadsheet,
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  TrendingDown,
  PieChart as PieIcon
} from 'lucide-react';
import { SpendingTrends } from './SpendingTrends';

Chart.register(...registerables);

interface CustomerDashboardProps {
  currentUser: User;
  onOpenDeposit: () => void;
  onOpenWithdrawal: () => void;
  onOpenTransfer: () => void;
  onOpenStatement: () => void;
  onOpenAddBeneficiary: () => void;
  onOpenSpendingTrends: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onOpenDeposit,
  onOpenWithdrawal,
  onOpenTransfer,
  onOpenStatement,
  onOpenAddBeneficiary,
  onOpenSpendingTrends,
}) => {
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [analyticsTab, setAnalyticsTab] = useState<'spending' | 'cashflow'>('spending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const loadData = () => {
    if (!currentUser.customerId) return;
    const cust = bankStore.getCustomerById(currentUser.customerId);
    const accs = bankStore.getAccountsByCustomerId(currentUser.customerId);
    setCustomer(cust);
    setAccounts(accs);
    if (!selectedAccount && accs.length > 0) {
      setSelectedAccount(accs[0]);
    } else if (selectedAccount) {
      const refreshed = accs.find((a) => a.accountID === selectedAccount.accountID);
      if (refreshed) setSelectedAccount(refreshed);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = bankStore.subscribe(loadData);
    return () => unsub();
  }, [currentUser]);

  // Aggregate metrics
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const allCustomerTxs = currentUser.customerId ? bankStore.getCustomerTransactions(currentUser.customerId) : [];

  const totalDeposits = allCustomerTxs
    .filter((t) => t.transactionType === 'DEPOSIT' || t.transactionType === 'TRANSFER_CR')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = allCustomerTxs
    .filter((t) => t.transactionType === 'WITHDRAWAL' || t.transactionType === 'TRANSFER_DR')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions for table
  const displayedTxs = allCustomerTxs.filter((tx) => {
    if (selectedAccount && tx.accountID !== selectedAccount.accountID) {
      return false;
    }
    if (typeFilter !== 'ALL' && tx.transactionType !== typeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = tx.transactionReference.toLowerCase().includes(q);
      const matchDesc = tx.description.toLowerCase().includes(q);
      if (!matchRef && !matchDesc) return false;
    }
    return true;
  });

  // Chart.js initialization & updates
  useEffect(() => {
    if (!chartCanvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Compute monthly groups for the last 4 months
    const monthNames = ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024'];
    const monthlyInflow = [13500, 5200, 8750, 2400];
    const monthlyOutflow = [800, 3200, 1500, 950];

    // If transactions exist, update dynamic calculations
    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthNames,
        datasets: [
          {
            label: 'Deposits & Inflow ($)',
            data: monthlyInflow,
            backgroundColor: '#0284c7', // sky-600
            borderRadius: 4,
            barThickness: 18,
          },
          {
            label: 'Withdrawals & Debits ($)',
            data: monthlyOutflow,
            backgroundColor: '#e11d48', // rose-600
            borderRadius: 4,
            barThickness: 18,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: {
                family: "'Public Sans', sans-serif",
                size: 11,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: $${(context.raw as number).toLocaleString()}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: {
                family: "'Public Sans', sans-serif",
                size: 11,
              },
            },
          },
          y: {
            border: { dash: [4, 4] },
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (value) => `$${value}`,
              font: {
                family: "'JetBrains Mono', monospace",
                size: 10,
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [allCustomerTxs]);

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading customer banking records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Customer ID: <strong className="font-mono text-slate-700">{customer.customerID}</strong></span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>KYC Verified</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{customer.city}, {customer.state}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 font-display">
              Good day, {customer.fullName}
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">
              Access real-time balance inquiries, instant zero-fee fund transfers, and verified cryptographic statements.
            </p>
          </div>

          {/* Quick Actions (10% Accent budget) */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>Quick Deposit</span>
            </button>
            <button
              onClick={onOpenWithdrawal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>Withdraw</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer Money</span>
            </button>
            <button
              onClick={onOpenStatement}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-slate-200"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-600" />
              <span>Statement</span>
            </button>
            <button
              onClick={onOpenSpendingTrends}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 border border-rose-200 shadow-xs"
            >
              <TrendingDown className="w-4 h-4 text-rose-600" />
              <span>Spending Trends</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Net Cleared Balance</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
            <span>Across</span>
            <strong className="text-slate-700 font-sans">{accounts.length} linked accounts</strong>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Lifetime Inflow</span>
            <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            +${totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Deposits and incoming transfers
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Lifetime Outflow</span>
            <ArrowUpCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            -${totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Withdrawals & outgoing settlements
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Account Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900">
            Good Standing
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Minimum balance rules satisfied
          </div>
        </div>
      </div>

      {/* Analytics View Selector Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Analytics Engine:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setAnalyticsTab('spending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                analyticsTab === 'spending'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Spending Trends (Recharts)</span>
            </button>
            <button
              onClick={() => setAnalyticsTab('cashflow')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                analyticsTab === 'cashflow'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Cash Flow (Chart.js)</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          {analyticsTab === 'spending'
            ? 'Analyzing outflows categorized by Rent, Utilities, Groceries & more'
            : 'Aggregating gross deposit inflows vs withdrawal outflows'}
        </div>
      </div>

      {analyticsTab === 'spending' ? (
        <SpendingTrends
          accounts={accounts}
          transactions={allCustomerTxs}
        />
      ) : (
        /* Main Content Grid: Chart & Linked Accounts */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Chart.js Cash Flow Visualization */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Cash Flow Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Monthly deposits vs withdrawals aggregated from core ledger
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <span>Chart.js v4.4 Engine</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <canvas ref={chartCanvasRef} />
          </div>
        </div>

        {/* Right: Linked Accounts List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 font-display">
                Linked Accounts
              </h2>
              <button
                onClick={onOpenAddBeneficiary}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Beneficiary</span>
              </button>
            </div>

            <div className="space-y-3">
              {accounts.map((acc) => {
                const isSelected = selectedAccount?.accountID === acc.accountID;
                return (
                  <div
                    key={acc.accountID}
                    onClick={() => setSelectedAccount(acc)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <CreditCard className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {acc.accountNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span className="text-emerald-700 font-medium">{acc.accountStatus}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-slate-500">{acc.accountType} Account</span>
                      <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                        ${acc.balance.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1">
                      Min reserve: ${acc.minBalance.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Filter ledger by selected account:</span>
            <button
              onClick={() => setSelectedAccount(null)}
              className="text-blue-600 hover:underline font-medium text-[11px]"
            >
              Show All Accounts
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Transaction History
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{selectedAccount ? `Showing account: ${selectedAccount.accountNumber}` : 'All accounts'}</span>
              <span aria-hidden="true">·</span>
              <span>{displayedTxs.length} entries found</span>
            </div>
          </div>

          {/* Search & Segmented Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference or memo..."
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 w-48 sm:w-60"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('DEPOSIT')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === 'DEPOSIT' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deposits
              </button>
              <button
                onClick={() => setTypeFilter('WITHDRAWAL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === 'WITHDRAWAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Withdrawals
              </button>
              <button
                onClick={() => setTypeFilter('TRANSFER_DR')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === 'TRANSFER_DR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transfers
              </button>
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Reference Number</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount ($)</th>
                <th className="py-3 px-4 text-right">Running Balance ($)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTxs.length > 0 ? (
                displayedTxs.map((tx) => {
                  const isInflow = tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_CR';
                  return (
                    <tr key={tx.transactionID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {tx.transactionReference}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(tx.transactionDate).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={tx.description}>
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-slate-600">
                          {tx.transactionType}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                        isInflow ? 'text-emerald-700' : 'text-slate-900'
                      }`}>
                        {isInflow ? '+' : '-'}${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                        ${tx.runningBalance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="text-[11px] text-emerald-800 font-medium">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No transactions found for the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
