import React, { useState, useEffect } from 'react';
import { Customer, Account, Transaction, User } from '../../types';
import { bankStore } from '../../services/bankStore';
import {
  Users,
  UserPlus,
  ArrowDownCircle,
  ArrowUpCircle,
  Search,
  PlusCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  onSuccessNotice: (msg: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  onSuccessNotice,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'register' | 'counter_ops' | 'open_account'>('customers');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // New Customer Registration form state
  const [regFullName, setRegFullName] = useState('');
  const [regDob, setRegDob] = useState('1995-06-15');
  const [regGender, setRegGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regPinCode, setRegPinCode] = useState('');
  const [regAccountType, setRegAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [regInitialDeposit, setRegInitialDeposit] = useState('1000');
  const [regError, setRegError] = useState('');

  // Over the counter operation state
  const [counterAccNum, setCounterAccNum] = useState('');
  const [counterOpType, setCounterOpType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [counterAmount, setCounterAmount] = useState('100');
  const [counterMemo, setCounterMemo] = useState('');
  const [counterMsg, setCounterMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Additional account for existing customer state
  const [targetCustId, setTargetCustId] = useState<number | ''>('');
  const [newAccType, setNewAccType] = useState<'SAVINGS' | 'CURRENT'>('CURRENT');
  const [newAccDeposit, setNewAccDeposit] = useState('500');

  const loadData = () => {
    setCustomers(bankStore.getCustomers());
    setAccounts(bankStore.getAccounts());
    setTransactions(bankStore.getTransactions());
  };

  useEffect(() => {
    loadData();
    const unsub = bankStore.subscribe(loadData);
    return () => unsub();
  }, []);

  const handleRegisterCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setRegError('Please complete all mandatory customer identity fields.');
      return;
    }

    const initDep = parseFloat(regInitialDeposit) || 0;
    if (regAccountType === 'SAVINGS' && initDep < 500) {
      setRegError('Savings account requires minimum opening deposit of $500.00.');
      return;
    }

    try {
      const res = bankStore.registerCustomer(
        {
          fullName: regFullName.trim(),
          dateOfBirth: regDob,
          gender: regGender,
          email: regEmail.trim(),
          phone: regPhone.trim(),
          address: regAddress.trim() || '123 Boulevard',
          city: regCity.trim() || 'Metropolis',
          state: regState.trim() || 'NY',
          pinCode: regPinCode.trim() || '10001',
        },
        initDep,
        regAccountType
      );

      onSuccessNotice(
        `Customer ${res.customer.fullName} onboarded. Customer ID: ${res.customer.customerID}, Account: ${res.account.accountNumber}`
      );

      // Reset
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegAddress('');
      setRegCity('');
      setRegState('');
      setRegPinCode('');
      setRegInitialDeposit('1000');
      setActiveTab('customers');
    } catch (err: any) {
      setRegError(err.message || 'Failed to onboard customer.');
    }
  };

  const handleExecuteCounterOp = (e: React.FormEvent) => {
    e.preventDefault();
    setCounterMsg(null);

    const amt = parseFloat(counterAmount);
    if (isNaN(amt) || amt <= 0) {
      setCounterMsg({ type: 'error', text: 'Specify a valid dollar amount.' });
      return;
    }

    const actor = { id: currentUser.id, role: currentUser.role, name: currentUser.fullName };

    if (counterOpType === 'DEPOSIT') {
      const res = bankStore.deposit(counterAccNum, amt, counterMemo || 'Teller Counter Deposit', actor);
      if (res.success) {
        setCounterMsg({ type: 'success', text: res.message });
        onSuccessNotice(res.message);
      } else {
        setCounterMsg({ type: 'error', text: res.message });
      }
    } else {
      const res = bankStore.withdraw(counterAccNum, amt, counterMemo || 'Teller Counter Withdrawal', actor);
      if (res.success) {
        setCounterMsg({ type: 'success', text: res.message });
        onSuccessNotice(res.message);
      } else {
        setCounterMsg({ type: 'error', text: res.message });
      }
    }
  };

  const handleCreateAdditionalAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustId) return;

    const dep = parseFloat(newAccDeposit) || 0;
    try {
      const acc = bankStore.createAccountForExistingCustomer(
        Number(targetCustId),
        newAccType,
        dep,
        { id: currentUser.id, role: currentUser.role }
      );
      onSuccessNotice(`Provisioned ${newAccType} Account ${acc.accountNumber} with $${dep.toFixed(2)} opening deposit.`);
      setActiveTab('customers');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.customerID.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Employee Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold tracking-wider uppercase">
              <Users className="w-4 h-4" />
              <span>Branch Operations & Teller Desk</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
              Teller & Customer Service Portal
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Onboard new customers, execute over-the-counter deposits and withdrawals, and inspect client ledger histories.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('register')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Onboard New Customer</span>
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 mt-6 overflow-x-auto">
          {[
            { id: 'customers', label: `Customer Directory (${customers.length})` },
            { id: 'register', label: 'Onboard Customer (KYC)' },
            { id: 'counter_ops', label: 'Over-The-Counter Cash Desk' },
            { id: 'open_account', label: 'Provision Secondary Account' },
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

      {/* Tab 1: Customer Directory */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 font-display">
                Registered Bank Customers
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 w-52"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Customer ID</th>
                    <th className="py-2.5 px-4">Full Name</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Location</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.customerID === cust.customerID;
                    return (
                      <tr
                        key={cust.customerID}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          #{cust.customerID}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {cust.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>{cust.email}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{cust.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">
                          {cust.city}, {cust.state}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(cust);
                            }}
                            className="px-2 py-1 text-[11px] text-blue-600 font-medium hover:underline"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Customer Details Inspector */}
          <div className="lg:col-span-5">
            {selectedCustomer ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-400">ID #{selectedCustomer.customerID}</span>
                    <h3 className="font-bold text-base text-slate-900 font-display">
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="text-xs text-slate-500">{selectedCustomer.email} · {selectedCustomer.phone}</p>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Client</span>
                  </span>
                </div>

                <div className="text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span>Date of Birth:</span>
                    <span className="font-mono text-slate-800">{selectedCustomer.dateOfBirth} ({selectedCustomer.gender})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <span className="text-slate-800">{selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.pinCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Member Since:</span>
                    <span className="text-slate-800">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="font-semibold text-xs text-slate-700 mb-2">Accounts Held</h4>
                  <div className="space-y-2">
                    {bankStore.getAccountsByCustomerId(selectedCustomer.customerID).map((acc) => (
                      <div
                        key={acc.accountID}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-slate-900">{acc.accountNumber}</div>
                          <div className="text-[11px] text-slate-500">{acc.accountType} Account · {acc.accountStatus}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900 text-sm">${acc.balance.toFixed(2)}</div>
                          <button
                            onClick={() => {
                              setCounterAccNum(acc.accountNumber);
                              setActiveTab('counter_ops');
                            }}
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            Counter Service →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                Select a customer from the directory to review their KYC information and accounts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Onboard Customer (KYC Registration) */}
      {activeTab === 'register' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-2xl mx-auto">
          <div className="mb-6">
            <h3 className="font-bold text-base text-slate-900 font-display">
              Onboard New Customer (KYC Application)
            </h3>
            <p className="text-xs text-slate-500">
              Provide verifiable customer identity and establish initial savings or current ledger account.
            </p>
          </div>

          {regError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterCustomer} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Residential Street Address</label>
              <input
                type="text"
                placeholder="Street address line"
                value={regAddress}
                onChange={(e) => setRegAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Metropolis"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  placeholder="NY"
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PIN / Postal Code</label>
                <input
                  type="text"
                  placeholder="10001"
                  value={regPinCode}
                  onChange={(e) => setRegPinCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Account Type</label>
                <select
                  value={regAccountType}
                  onChange={(e) => setRegAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                >
                  <option value="SAVINGS">Savings Account (Min $500 balance)</option>
                  <option value="CURRENT">Current Account (Checking)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Cash Deposit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={regInitialDeposit}
                  onChange={(e) => setRegInitialDeposit(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('customers')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm"
              >
                Register & Open Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Over the Counter Cash Desk */}
      {activeTab === 'counter_ops' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl mx-auto">
          <div className="mb-6">
            <h3 className="font-bold text-base text-slate-900 font-display">
              Over-The-Counter Cash Desk
            </h3>
            <p className="text-xs text-slate-500">
              Execute direct counter deposits or cash disbursements on behalf of walk-in customers.
            </p>
          </div>

          {counterMsg && (
            <div
              className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
                counterMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-700'
              }`}
            >
              {counterMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{counterMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleExecuteCounterOp} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Account Number</label>
              <input
                type="text"
                required
                placeholder="e.g. BPRO10010001"
                value={counterAccNum}
                onChange={(e) => setCounterAccNum(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operation Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCounterOpType('DEPOSIT')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    counterOpType === 'DEPOSIT'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                  <span>Cash Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCounterOpType('WITHDRAWAL')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    counterOpType === 'WITHDRAWAL'
                      ? 'border-rose-600 bg-rose-50 text-rose-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4 text-rose-600" />
                  <span>Cash Withdrawal</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teller Memo</label>
              <input
                type="text"
                placeholder="Walk-in cash counter operation"
                value={counterMemo}
                onChange={(e) => setCounterMemo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`w-full py-2.5 rounded-lg text-white font-semibold text-xs transition-colors shadow-sm ${
                  counterOpType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Execute {counterOpType === 'DEPOSIT' ? 'Cash Deposit' : 'Cash Disbursement'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Provision Additional Account for Customer */}
      {activeTab === 'open_account' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg mx-auto">
          <div className="mb-6">
            <h3 className="font-bold text-base text-slate-900 font-display">
              Provision Additional Account
            </h3>
            <p className="text-xs text-slate-500">
              Open a secondary Savings or Current account for an existing verified client.
            </p>
          </div>

          <form onSubmit={handleCreateAdditionalAccount} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Customer</label>
              <select
                value={targetCustId}
                onChange={(e) => setTargetCustId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                required
              >
                <option value="" disabled>-- Select Existing Customer --</option>
                {customers.map((c) => (
                  <option key={c.customerID} value={c.customerID}>
                    {c.fullName} (ID #{c.customerID} - {c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Account Type</label>
              <select
                value={newAccType}
                onChange={(e) => setNewAccType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="CURRENT">Current Account (Checking)</option>
                <option value="SAVINGS">Savings Account (Requires $500 min reserve)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Opening Deposit Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newAccDeposit}
                onChange={(e) => setNewAccDeposit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs shadow-sm"
              >
                Provision Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
