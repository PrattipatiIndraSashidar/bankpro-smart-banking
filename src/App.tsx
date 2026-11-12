import React, { useState, useEffect } from 'react';
import { User, UserRole, Customer, Account, Beneficiary } from './types';
import { bankStore } from './services/bankStore';
import { Navbar } from './components/common/Navbar';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { DepositModal } from './components/customer/DepositModal';
import { WithdrawalModal } from './components/customer/WithdrawalModal';
import { TransferModal } from './components/customer/TransferModal';
import { StatementModal } from './components/customer/StatementModal';
import { AddBeneficiaryModal } from './components/customer/AddBeneficiaryModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { EmployeeDashboard } from './components/employee/EmployeeDashboard';
import { SqlWorkbench } from './components/sql/SqlWorkbench';
import { AuthModal } from './components/auth/AuthModal';
import { LandingHero } from './components/landing/LandingHero';
import { SpendingTrends } from './components/customer/SpendingTrends';
import { NotificationToast } from './components/common/NotificationToast';
import { RotateCcw, Shield, Database, Github, ExternalLink, ArrowLeft } from 'lucide-react';

export default function App() {
  // Default to Alice Henderson as active demo customer for immediate high-fidelity experience
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: '1001',
    username: 'alice',
    role: 'CUSTOMER',
    fullName: 'Alice Henderson',
    email: 'alice@example.com',
    customerId: 1001,
  });

  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Modals
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [isBeneficiaryOpen, setIsBeneficiaryOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleSwitchUser = (role: UserRole, id: string) => {
    if (role === 'ADMIN') {
      setCurrentUser({
        id: '501',
        username: 'admin',
        role: 'ADMIN',
        fullName: 'Sarah Connor',
        email: 'sconnor@bankpro.internal',
        employeeId: 501,
      });
      setCurrentView('dashboard');
      showToast('Switched persona to System Administrator (Sarah Connor).');
    } else if (role === 'EMPLOYEE') {
      setCurrentUser({
        id: '502',
        username: 'teller',
        role: 'EMPLOYEE',
        fullName: 'David Miller',
        email: 'dmiller@bankpro.internal',
        employeeId: 502,
      });
      setCurrentView('dashboard');
      showToast('Switched persona to Bank Teller (David Miller).');
    } else {
      const cust = bankStore.getCustomerById(parseInt(id, 10)) || bankStore.getCustomers()[0];
      setCurrentUser({
        id: cust.customerID.toString(),
        username: cust.fullName.split(' ')[0].toLowerCase(),
        role: 'CUSTOMER',
        fullName: cust.fullName,
        email: cust.email,
        customerId: cust.customerID,
      });
      setCurrentView('dashboard');
      showToast(`Switched persona to Customer (${cust.fullName}).`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    showToast('You have been signed out.');
  };

  const handleResetData = () => {
    if (window.confirm('Reset all accounts and transaction history to initial seed database state?')) {
      bankStore.resetDemoData();
      showToast('BankPro database has been reset to baseline factory seed data.');
    }
  };

  // Resolve Customer Accounts & Beneficiaries for Modals
  const activeCustomer = currentUser?.customerId ? bankStore.getCustomerById(currentUser.customerId) : undefined;
  const customerAccounts = currentUser?.customerId ? bankStore.getAccountsByCustomerId(currentUser.customerId) : [];
  const customerBeneficiaries = currentUser?.customerId ? bankStore.getBeneficiaries(currentUser.customerId) : [];
  const customerTransactions = currentUser?.customerId ? bankStore.getCustomerTransactions(currentUser.customerId) : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Bar Navigation */}
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'deposit') {
            setIsDepositOpen(true);
          } else if (view === 'withdraw') {
            setIsWithdrawOpen(true);
          } else if (view === 'transfer') {
            setIsTransferOpen(true);
          } else if (view === 'statement') {
            setIsStatementOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* SQL Studio View */}
        {currentView === 'sql' ? (
          <SqlWorkbench />
        ) : !currentUser ? (
          /* Public Landing Page */
          <LandingHero
            onQuickLogin={handleSwitchUser}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setIsAuthOpen(true);
            }}
            onNavigateSql={() => setCurrentView('sql')}
          />
        ) : currentUser.role === 'ADMIN' ? (
          /* Admin Console */
          <AdminDashboard
            currentUser={currentUser}
            onSuccessNotice={(msg) => showToast(msg, 'success')}
          />
        ) : currentUser.role === 'EMPLOYEE' ? (
          /* Teller / Employee Console */
          <EmployeeDashboard
            currentUser={currentUser}
            onSuccessNotice={(msg) => showToast(msg, 'success')}
          />
        ) : currentView === 'spending' && currentUser ? (
          /* Dedicated Spending Trends View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="text-xs text-slate-500">
                Viewing Outflow Analytics for <strong className="text-slate-900">{currentUser.fullName}</strong>
              </div>
            </div>
            <SpendingTrends
              accounts={customerAccounts}
              transactions={customerTransactions}
            />
          </div>
        ) : (
          /* Customer Banking Dashboard */
          <CustomerDashboard
            currentUser={currentUser}
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdrawal={() => setIsWithdrawOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onOpenStatement={() => setIsStatementOpen(true)}
            onOpenAddBeneficiary={() => setIsBeneficiaryOpen(true)}
            onOpenSpendingTrends={() => setCurrentView('spending')}
          />
        )}
      </main>

      {/* Transaction & Action Modals */}
      {currentUser && (
        <>
          <DepositModal
            isOpen={isDepositOpen}
            onClose={() => setIsDepositOpen(false)}
            accounts={customerAccounts.filter((a) => a.accountStatus === 'ACTIVE')}
            currentUser={currentUser}
            onSuccess={(msg) => showToast(msg, 'success')}
          />

          <WithdrawalModal
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            accounts={customerAccounts.filter((a) => a.accountStatus === 'ACTIVE')}
            currentUser={currentUser}
            onSuccess={(msg) => showToast(msg, 'success')}
          />

          <TransferModal
            isOpen={isTransferOpen}
            onClose={() => setIsTransferOpen(false)}
            accounts={customerAccounts.filter((a) => a.accountStatus === 'ACTIVE')}
            beneficiaries={customerBeneficiaries}
            currentUser={currentUser}
            onSuccess={(msg) => showToast(msg, 'success')}
          />

          {activeCustomer && (
            <>
              <StatementModal
                isOpen={isStatementOpen}
                onClose={() => setIsStatementOpen(false)}
                customer={activeCustomer}
                accounts={customerAccounts}
              />

              <AddBeneficiaryModal
                isOpen={isBeneficiaryOpen}
                onClose={() => setIsBeneficiaryOpen(false)}
                customer={activeCustomer}
                onSuccess={(msg) => showToast(msg, 'success')}
              />
            </>
          )}
        </>
      )}

      {/* Authentication Gateway Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setCurrentView('dashboard');
          showToast(`Welcome back, ${user.fullName}!`);
        }}
      />

      {/* Notification Toast */}
      <NotificationToast
        message={toast?.message || null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />

      {/* Quiet Technical Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900 font-display">BankPro</span>
            <span aria-hidden="true">·</span>
            <span>Microsoft SQL Server 2022 Architecture</span>
            <span aria-hidden="true">·</span>
            <span>ACID Double-Entry Ledger</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('sql')}
              className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Database className="w-3.5 h-3.5" />
              <span>T-SQL Studio</span>
            </button>
            <button
              onClick={handleResetData}
              className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
              title="Reset mock database to initial seed data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
