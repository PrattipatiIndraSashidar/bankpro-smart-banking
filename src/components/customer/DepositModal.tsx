import React, { useState } from 'react';
import { Account, User } from '../../types';
import { bankStore } from '../../services/bankStore';
import { ArrowDownCircle, X, AlertCircle } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  currentUser: User;
  onSuccess: (message: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentUser,
  onSuccess,
}) => {
  const [selectedAccNum, setSelectedAccNum] = useState<string>(accounts[0]?.accountNumber || '');
  const [amount, setAmount] = useState<string>('500');
  const [description, setDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please enter a valid deposit amount greater than $0.00.');
      return;
    }

    setIsSubmitting(true);
    const result = bankStore.deposit(
      selectedAccNum,
      numericAmount,
      description.trim() || 'Electronic Account Deposit',
      { id: currentUser.id, role: currentUser.role, name: currentUser.fullName }
    );
    setIsSubmitting(false);

    if (result.success) {
      onSuccess(result.message);
      onClose();
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base font-display">Deposit Funds</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Destination Account
            </label>
            <select
              value={selectedAccNum}
              onChange={(e) => setSelectedAccNum(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              {accounts.map((acc) => (
                <option key={acc.accountID} value={acc.accountNumber}>
                  {acc.accountNumber} ({acc.accountType} - Cleared: ${acc.balance.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deposit Amount ($)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div className="flex gap-2 mt-2">
              {['100', '500', '1000', '5000'].map((quick) => (
                <button
                  type="button"
                  key={quick}
                  onClick={() => setAmount(quick)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                >
                  +${quick}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deposit Memo / Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Consulting income, Check deposit, Transfer from payroll"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Complete Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
