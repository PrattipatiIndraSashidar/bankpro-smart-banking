import React, { useState } from 'react';
import { Account, Beneficiary, User } from '../../types';
import { bankStore } from '../../services/bankStore';
import { ArrowLeftRight, X, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  beneficiaries: Beneficiary[];
  currentUser: User;
  onSuccess: (message: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  beneficiaries,
  currentUser,
  onSuccess,
}) => {
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [senderAccNum, setSenderAccNum] = useState<string>(accounts[0]?.accountNumber || '');
  const [receiverAccNum, setReceiverAccNum] = useState<string>(beneficiaries[0]?.beneficiaryAccountNumber || '');
  const [amount, setAmount] = useState<string>('250');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const senderAccount = accounts.find((a) => a.accountNumber === senderAccNum) || accounts[0];
  const requiredFloor = senderAccount ? (senderAccount.accountType === 'SAVINGS' ? senderAccount.minBalance : 0) : 0;
  const maxAvailable = senderAccount ? Math.max(0, senderAccount.balance - requiredFloor) : 0;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Please specify a positive transfer amount.');
      return;
    }

    if (senderAccNum.trim().toUpperCase() === receiverAccNum.trim().toUpperCase()) {
      setErrorMessage('Cannot transfer to the same account. Select a different recipient account.');
      return;
    }

    if (numericAmount > maxAvailable) {
      setErrorMessage(
        `Insufficient cleared funds. Savings accounts must maintain a $${requiredFloor.toFixed(2)} reserve. Available: $${maxAvailable.toFixed(2)}.`
      );
      return;
    }

    const target = bankStore.getAccountByNumber(receiverAccNum);
    if (!target) {
      setErrorMessage(`Beneficiary account "${receiverAccNum}" not found in BankPro system.`);
      return;
    }

    if (target.accountStatus !== 'ACTIVE') {
      setErrorMessage(`Beneficiary account is ${target.accountStatus}. Funds cannot be received.`);
      return;
    }

    setStep('confirm');
  };

  const handleExecuteTransfer = () => {
    setIsSubmitting(true);
    setErrorMessage('');

    const numericAmount = parseFloat(amount);
    const result = bankStore.transfer(
      senderAccNum,
      receiverAccNum,
      numericAmount,
      notes.trim(),
      { id: currentUser.id, role: currentUser.role, name: currentUser.fullName }
    );

    setIsSubmitting(false);

    if (result.success) {
      onSuccess(result.message);
      onClose();
      setStep('input');
    } else {
      setErrorMessage(result.message);
      setStep('input');
    }
  };

  const receiverAccount = bankStore.getAccountByNumber(receiverAccNum);
  const receiverCustomer = receiverAccount ? bankStore.getCustomerById(receiverAccount.customerID) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base font-display">
              {step === 'input' ? 'Transfer Funds' : 'Review & Confirm Transfer'}
            </h3>
          </div>
          <button
            onClick={() => {
              setStep('input');
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'input' ? (
          <form onSubmit={handleReview} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Source Account (Debit)
              </label>
              <select
                value={senderAccNum}
                onChange={(e) => setSenderAccNum(e.target.value)}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Beneficiary Account (Credit)
                </label>
                {beneficiaries.length > 0 && (
                  <span className="text-[11px] text-blue-600">
                    Saved Beneficiaries Available
                  </span>
                )}
              </div>

              {beneficiaries.length > 0 ? (
                <div className="space-y-2">
                  <select
                    value={receiverAccNum}
                    onChange={(e) => setReceiverAccNum(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="" disabled>-- Select Saved Beneficiary --</option>
                    {beneficiaries.map((b) => (
                      <option key={b.beneficiaryID} value={b.beneficiaryAccountNumber}>
                        {b.beneficiaryName} ({b.beneficiaryAccountNumber})
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>Or enter manual Account Number:</span>
                    <input
                      type="text"
                      placeholder="e.g. BPRO10030003"
                      value={receiverAccNum}
                      onChange={(e) => setReceiverAccNum(e.target.value.toUpperCase())}
                      className="px-2 py-0.5 border border-slate-300 rounded text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-blue-600 w-36"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. BPRO10020002"
                  value={receiverAccNum}
                  onChange={(e) => setReceiverAccNum(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Transfer Amount ($)
                </label>
                <span className="text-[11px] text-slate-500">
                  Max Available: <strong className="text-slate-800 font-mono">${maxAvailable.toFixed(2)}</strong>
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={maxAvailable}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Memo / Tag
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Shared Apartment Rent, Utilities split, Groceries"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                maxLength={100}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Shared Rent', 'Utilities Split', 'Groceries', 'Dinner Dining', 'Travel'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setNotes(tag)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    +{tag}
                  </button>
                ))}
              </div>
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
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>Review Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Confirmation Dialog */
          <div className="p-6 space-y-5">
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Verify Recipient & Ledger Settlement</span>
              </div>

              <div className="space-y-2 pt-1 border-t border-blue-100 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">From Account:</span>
                  <span className="font-bold text-slate-900">{senderAccNum}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">To Beneficiary:</span>
                  <span className="font-bold text-slate-900">
                    {receiverCustomer ? `${receiverCustomer.fullName} (${receiverAccNum})` : receiverAccNum}
                  </span>
                </div>
                <div className="flex justify-between text-base pt-1 border-t border-blue-100 text-blue-900">
                  <span className="font-sans font-bold">Transfer Amount:</span>
                  <span className="font-bold">${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Network Transfer Fee:</span>
                  <span className="text-emerald-700 font-bold">$0.00 (Instant Zero-Fee)</span>
                </div>
                {notes && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Memo:</span>
                    <span className="font-sans text-slate-800">{notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Transactions are atomic and irrevocable. Balances are updated instantaneously in both ledgers with ACID compliance.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('input')}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleExecuteTransfer}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Settling Ledger...' : 'Confirm & Send Money'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
