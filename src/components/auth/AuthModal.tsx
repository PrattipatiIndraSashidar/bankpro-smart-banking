import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { bankStore } from '../../services/bankStore';
import { Lock, Mail, User as UserIcon, X, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  onLoginSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [error, setError] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+1 (555) 777-8899');
  const [regAccType, setRegAccType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [regDeposit, setRegDeposit] = useState('1000');

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-mapped demo accounts
    if (username.toLowerCase() === 'admin' || role === 'ADMIN') {
      const admin = bankStore.getEmployees().find((e) => e.role === 'ADMIN');
      onLoginSuccess({
        id: '501',
        username: 'admin',
        role: 'ADMIN',
        fullName: admin ? admin.employeeName : 'Sarah Connor',
        email: admin ? admin.email : 'admin@bankpro.internal',
        employeeId: 501,
      });
      onClose();
      return;
    }

    if (username.toLowerCase() === 'employee' || username.toLowerCase() === 'teller' || role === 'EMPLOYEE') {
      const emp = bankStore.getEmployees().find((e) => e.role === 'TELLER');
      onLoginSuccess({
        id: '502',
        username: 'teller',
        role: 'EMPLOYEE',
        fullName: emp ? emp.employeeName : 'David Miller',
        email: emp ? emp.email : 'dmiller@bankpro.internal',
        employeeId: 502,
      });
      onClose();
      return;
    }

    // Customer login: alice or bob or custom
    const customers = bankStore.getCustomers();
    let matchedCust = customers.find(
      (c) =>
        c.email.toLowerCase().includes(username.toLowerCase()) ||
        c.fullName.toLowerCase().includes(username.toLowerCase())
    );

    if (!matchedCust) {
      matchedCust = customers[0]; // fallback to Alice
    }

    onLoginSuccess({
      id: matchedCust.customerID.toString(),
      username: matchedCust.fullName.split(' ')[0].toLowerCase(),
      role: 'CUSTOMER',
      fullName: matchedCust.fullName,
      email: matchedCust.email,
      customerId: matchedCust.customerID,
    });
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regEmail.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    const initDep = parseFloat(regDeposit) || 0;
    if (regAccType === 'SAVINGS' && initDep < 500) {
      setError('Savings accounts require a minimum opening deposit of $500.00.');
      return;
    }

    const res = bankStore.registerCustomer(
      {
        fullName: regName.trim(),
        dateOfBirth: '1996-05-20',
        gender: 'Other',
        email: regEmail.trim(),
        phone: regPhone.trim(),
        address: '100 Bank Plaza',
        city: 'Metropolis',
        state: 'NY',
        pinCode: '10001',
      },
      initDep,
      regAccType
    );

    onLoginSuccess({
      id: res.customer.customerID.toString(),
      username: res.customer.fullName.split(' ')[0].toLowerCase(),
      role: 'CUSTOMER',
      fullName: res.customer.fullName,
      email: res.customer.email,
      customerId: res.customer.customerID,
    });
    onClose();
  };

  const quickLoginAs = (presetRole: UserRole, id: string) => {
    if (presetRole === 'ADMIN') {
      onLoginSuccess({
        id: '501',
        username: 'admin',
        role: 'ADMIN',
        fullName: 'Sarah Connor',
        email: 'sconnor@bankpro.internal',
        employeeId: 501,
      });
    } else if (presetRole === 'EMPLOYEE') {
      onLoginSuccess({
        id: '502',
        username: 'teller',
        role: 'EMPLOYEE',
        fullName: 'David Miller',
        email: 'dmiller@bankpro.internal',
        employeeId: 502,
      });
    } else {
      const cust = bankStore.getCustomerById(parseInt(id, 10)) || bankStore.getCustomers()[0];
      onLoginSuccess({
        id: cust.customerID.toString(),
        username: cust.fullName.split(' ')[0].toLowerCase(),
        role: 'CUSTOMER',
        fullName: cust.fullName,
        email: cust.email,
        customerId: cust.customerID,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base font-display">
              {mode === 'login' ? 'BankPro Secure Sign In' : 'Open BankPro Account'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Quick Demo Personas Bar */}
          <div className="mb-5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Instant 1-Click Demo Login
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLoginAs('CUSTOMER', '1001')}
                className="p-2 bg-white border border-slate-200 hover:border-blue-400 rounded text-left transition-colors"
              >
                <div className="font-bold text-slate-900">Alice Henderson</div>
                <div className="text-[10px] text-slate-500">Customer ($15,500)</div>
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('CUSTOMER', '1002')}
                className="p-2 bg-white border border-slate-200 hover:border-blue-400 rounded text-left transition-colors"
              >
                <div className="font-bold text-slate-900">Bob Alexander</div>
                <div className="text-[10px] text-slate-500">Customer ($4,200)</div>
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('EMPLOYEE', '502')}
                className="p-2 bg-white border border-slate-200 hover:border-amber-400 rounded text-left transition-colors"
              >
                <div className="font-bold text-slate-900">David Miller</div>
                <div className="text-[10px] text-slate-500">Bank Teller Desk</div>
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('ADMIN', '501')}
                className="p-2 bg-white border border-slate-200 hover:border-rose-400 rounded text-left transition-colors"
              >
                <div className="font-bold text-slate-900">Sarah Connor</div>
                <div className="text-[10px] text-slate-500">System Administrator</div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-4">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Portal Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CUSTOMER', 'EMPLOYEE', 'ADMIN'] as UserRole[]).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setRole(r)}
                      className={`py-1.5 px-2 rounded-lg border font-semibold text-center transition-colors ${
                        role === r
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">User Identifier / Email</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="e.g. alice or admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Access Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                Authenticate & Enter System
              </button>

              <div className="text-center pt-2 text-slate-500">
                Don't have an active account yet?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Register Now
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Katherine Pierce"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="katherine@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={regAccType}
                    onChange={(e) => setRegAccType(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="SAVINGS">Savings (Min $500)</option>
                    <option value="CURRENT">Current Account</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Deposit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={regDeposit}
                    onChange={(e) => setRegDeposit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                Complete Registration & Open Account
              </button>

              <div className="text-center pt-2 text-slate-500">
                Already registered with BankPro?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
