import React, { useEffect, useState } from 'react';
import { Account, Customer, Employee, Transaction, Transfer, User } from '../../types';
import { bankStore } from '../../services/bankStore';
import {
  Users,
  Building,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Snowflake,
  Flame,
  Search,
  Download,
  Shield,
  UserPlus
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onSuccessNotice: (msg: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onSuccessNotice,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'employees' | 'monitoring' | 'audit'>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [auditLogs, setAuditLogs] = useState(bankStore.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');

  // Add employee modal state
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'TELLER' | 'BRANCH_MANAGER' | 'AUDITOR'>('TELLER');

  const loadData = () => {
    setCustomers(bankStore.getCustomers());
    setAccounts(bankStore.getAccounts());
    setTransactions(bankStore.getTransactions());
    setTransfers(bankStore.getTransfers());
    setEmployees(bankStore.getEmployees());
    setAuditLogs(bankStore.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const unsub = bankStore.subscribe(loadData);
    return () => unsub();
  }, []);

  // System KPI calculations
  const totalLiquidity = accounts.reduce((sum, a) => sum + a.balance, 0);
  const activeAccounts = accounts.filter((a) => a.accountStatus === 'ACTIVE');
  const frozenAccounts = accounts.filter((a) => a.accountStatus === 'FROZEN');
  const pendingAccounts = accounts.filter((a) => a.accountStatus === 'PENDING');

  const totalDepositsVolume = transactions
    .filter((t) => t.transactionType === 'DEPOSIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawalsVolume = transactions
    .filter((t) => t.transactionType === 'WITHDRAWAL')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransfersVolume = transfers.reduce((sum, t) => sum + t.amount, 0);

  // Suspicious transactions: transactions with amount >= $10,000 threshold or large transfers
  const suspiciousThreshold = bankStore.getSettings().suspiciousTxThreshold;
  const suspiciousTransactions = transactions.filter((t) => t.amount >= suspiciousThreshold);

  // Actions
  const handleApproveAccount = (accID: number) => {
    const success = bankStore.approveAccount(accID, { id: currentUser.id, role: currentUser.role });
    if (success) onSuccessNotice(`Application for Account ID #${accID} approved successfully.`);
  };

  const handleRejectAccount = (accID: number) => {
    const success = bankStore.rejectAccount(accID, { id: currentUser.id, role: currentUser.role });
    if (success) onSuccessNotice(`Application for Account ID #${accID} rejected and closed.`);
  };

  const handleFreezeAccount = (accID: number) => {
    const reason = window.prompt('Specify reason for freezing this account:', 'Compliance verification') || 'Administrative block';
    const success = bankStore.freezeAccount(accID, reason, { id: currentUser.id, role: currentUser.role });
    if (success) onSuccessNotice(`Account ID #${accID} has been FROZEN.`);
  };

  const handleUnfreezeAccount = (accID: number) => {
    const success = bankStore.unfreezeAccount(accID, { id: currentUser.id, role: currentUser.role });
    if (success) onSuccessNotice(`Account ID #${accID} has been UNFROZEN and restored to ACTIVE.`);
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpEmail.trim()) return;

    bankStore.addEmployee(
      { employeeName: newEmpName.trim(), email: newEmpEmail.trim(), role: newEmpRole },
      { id: currentUser.id, role: currentUser.role }
    );
    setNewEmpName('');
    setNewEmpEmail('');
    setShowAddEmpModal(false);
    onSuccessNotice(`Provisioned employee credential for ${newEmpName}.`);
  };

  const handleToggleEmployeeStatus = (empID: number) => {
    bankStore.toggleEmployeeStatus(empID, { id: currentUser.id, role: currentUser.role });
    onSuccessNotice(`Updated employee status.`);
  };

  const handleExportSystemReport = () => {
    const headers = ['Account Number', 'Customer Name', 'Account Type', 'Balance ($)', 'Status', 'Created At'];
    const rows = accounts.map((acc) => {
      const cust = customers.find((c) => c.customerID === acc.customerID);
      return [
        `"${acc.accountNumber}"`,
        `"${cust ? cust.fullName : 'Unknown'}"`,
        `"${acc.accountType}"`,
        acc.balance.toFixed(2),
        `"${acc.accountStatus}"`,
        `"${acc.createdAt}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BankPro_System_Accounts_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Admin Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold tracking-wider uppercase">
              <Shield className="w-4 h-4" />
              <span>Administrative Supervisory Console</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
              BankPro Central Management Console
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Supervise institution-wide liquidity, oversee account risk states, review new onboarding applications, and audit employee access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportSystemReport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export System CSV</span>
            </button>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision Employee</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 mt-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'System Overview' },
            { id: 'accounts', label: `Accounts & Applications (${pendingAccounts.length} pending)` },
            { id: 'monitoring', label: `AML & Monitoring (${suspiciousTransactions.length} alerts)` },
            { id: 'employees', label: `Staff Directory (${employees.length})` },
            { id: 'audit', label: 'Security Audit Log' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
                <span>Total Institution Liquidity</span>
                <Building className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                ${totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                Active deposits in vault & ledgers
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
                <span>Registered Customers</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {customers.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {accounts.length} total active accounts provisioned
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
                <span>Pending Applications</span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                {pendingAccounts.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {frozenAccounts.length} accounts currently frozen
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-center text-slate-500 text-xs mb-2">
                <span>Total Interbank P2P Volume</span>
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                ${totalTransfersVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-2">
                {transfers.length} cleared peer-to-peer transfers
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Approvals Quick Queue */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  Pending Account Applications Queue
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {pendingAccounts.length} pending
                </span>
              </div>

              {pendingAccounts.length > 0 ? (
                <div className="space-y-3">
                  {pendingAccounts.map((acc) => {
                    const cust = customers.find((c) => c.customerID === acc.customerID);
                    return (
                      <div
                        key={acc.accountID}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{cust ? cust.fullName : 'Customer'}</div>
                          <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                            {acc.accountNumber} · {acc.accountType} · Opening Deposit: ${acc.balance.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveAccount(acc.accountID)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectAccount(acc.accountID)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Zero pending account applications. All client submissions have been processed.
                </div>
              )}
            </div>

            {/* Institution Ledger Metrics */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="font-bold text-sm text-slate-900 font-display mb-4">
                Ledger Settlement Aggregates
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Total Deposits Processed:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm tabular-nums">
                    +${totalDepositsVolume.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Total Withdrawals Debited:</span>
                  <span className="font-mono font-bold text-rose-700 text-sm tabular-nums">
                    -${totalWithdrawalsVolume.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Total Transactions Logged:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                    {transactions.length} entries
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Daily Transfer Ceiling:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                    ${bankStore.getSettings().dailyTransferLimit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Accounts Management */}
      {activeTab === 'accounts' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-display">
                All Bank Accounts Registry
              </h3>
              <span className="text-xs text-slate-500">
                Manage account states, freeze/unfreeze risk accounts, and view holder profiles
              </span>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search account # or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Account Number</th>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Cleared Balance ($)</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts
                  .filter((a) => {
                    const cust = customers.find((c) => c.customerID === a.customerID);
                    const q = searchTerm.toLowerCase();
                    return (
                      a.accountNumber.toLowerCase().includes(q) ||
                      (cust && cust.fullName.toLowerCase().includes(q))
                    );
                  })
                  .map((acc) => {
                    const cust = customers.find((c) => c.customerID === acc.customerID);
                    return (
                      <tr key={acc.accountID} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {acc.accountNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {cust ? cust.fullName : 'Customer'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {acc.accountType}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          ${acc.balance.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[11px] font-mono font-medium ${
                              acc.accountStatus === 'ACTIVE'
                                ? 'text-emerald-700'
                                : acc.accountStatus === 'FROZEN'
                                ? 'text-blue-700'
                                : acc.accountStatus === 'PENDING'
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {acc.accountStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {acc.accountStatus === 'PENDING' && (
                              <button
                                onClick={() => handleApproveAccount(acc.accountID)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-500 transition-colors"
                              >
                                Approve
                              </button>
                            )}
                            {acc.accountStatus === 'ACTIVE' && (
                              <button
                                onClick={() => handleFreezeAccount(acc.accountID)}
                                className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center gap-1"
                              >
                                <Snowflake className="w-3 h-3 text-blue-500" />
                                <span>Freeze</span>
                              </button>
                            )}
                            {acc.accountStatus === 'FROZEN' && (
                              <button
                                onClick={() => handleUnfreezeAccount(acc.accountID)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1"
                              >
                                <Flame className="w-3 h-3" />
                                <span>Unfreeze</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: AML Monitoring & High Value Transactions */}
      {activeTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Anti-Money Laundering (AML) & Suspicious Volume Feed</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Threshold: &gt;= ${suspiciousThreshold.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Transactions exceeding the statutory compliance threshold ($10,000+) are automatically indexed for suspicious activity reporting.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-rose-50/70 border-b border-rose-100 text-rose-900 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Ref Number</th>
                    <th className="py-2.5 px-4">Account Number</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Amount ($)</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suspiciousTransactions.length > 0 ? (
                    suspiciousTransactions.map((tx) => {
                      const acc = accounts.find((a) => a.accountID === tx.accountID);
                      return (
                        <tr key={tx.transactionID} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">
                            {tx.transactionReference}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {acc ? acc.accountNumber : `Acc #${tx.accountID}`}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(tx.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {tx.transactionType}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-700">
                            ${tx.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{tx.description}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              FLAGGED: EXCEEDS_10K
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Zero transactions exceed the active suspicious transaction threshold.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Staff Directory */}
      {activeTab === 'employees' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Bank Employees & Tellers Directory
            </h3>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition-colors"
            >
              Add Staff Member
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Employee ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Email</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.employeeID} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      EMP-{emp.employeeID}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {emp.employeeName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {emp.email}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                      {emp.role}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-mono font-medium ${
                        emp.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {emp.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleEmployeeStatus(emp.employeeID)}
                          className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-100 transition-colors"
                        >
                          {emp.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Security Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Immutable Core Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Captures all financial mutations, authorization approvals, user registrations, and IP traces.
            </p>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Log ID</th>
                  <th className="py-2.5 px-4">Timestamp (UTC)</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Audit Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.logID} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-400">#{log.logID}</td>
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-bold whitespace-nowrap">
                      {log.userID} ({log.userRole})
                    </td>
                    <td className="py-2.5 px-4 text-blue-700 font-semibold whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">{log.ipAddress}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700 max-w-md">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-sm font-display">Provision Bank Employee</h3>
              <button
                onClick={() => setShowAddEmpModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployeeSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica Alba"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Bank Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jalba@bankpro.internal"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Operational Role</label>
                <select
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="TELLER">TELLER - Branch Desk & Counter Services</option>
                  <option value="BRANCH_MANAGER">BRANCH_MANAGER - Approvals & Account Overrides</option>
                  <option value="AUDITOR">AUDITOR - Read-only Compliance Reviewer</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500"
                >
                  Create Staff Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
