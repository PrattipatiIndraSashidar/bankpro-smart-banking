import React, { useState } from 'react';
import { Customer } from '../../types';
import { bankStore } from '../../services/bankStore';
import { UserPlus, X, AlertCircle } from 'lucide-react';

interface AddBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onSuccess: (message: string) => void;
}

export const AddBeneficiaryModal: React.FC<AddBeneficiaryModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedAcc = accountNumber.trim().toUpperCase();
    if (!trimmedAcc) {
      setErrorMessage('Account number is required.');
      return;
    }

    const targetAccount = bankStore.getAccountByNumber(trimmedAcc);
    if (!targetAccount) {
      setErrorMessage(`Account "${trimmedAcc}" does not exist in BankPro.`);
      return;
    }

    if (targetAccount.customerID === customer.customerID) {
      setErrorMessage('You cannot add your own account as a beneficiary.');
      return;
    }

    const recipientCustomer = bankStore.getCustomerById(targetAccount.customerID);
    const resolvedName = name.trim() || (recipientCustomer ? recipientCustomer.fullName : 'BankPro Beneficiary');

    const added = bankStore.addBeneficiary(customer.customerID, trimmedAcc, resolvedName);
    if (!added) {
      setErrorMessage('This account is already in your beneficiary list.');
      return;
    }

    onSuccess(`Added ${resolvedName} (${trimmedAcc}) to saved beneficiaries.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base font-display">Add Beneficiary</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
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
              Beneficiary Account Number
            </label>
            <input
              type="text"
              placeholder="e.g. BPRO10020002"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <div className="text-[11px] text-slate-400 mt-1">
              Must be an active BankPro 12-character account identifier.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Beneficiary Nickname / Name (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank to auto-detect account name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-sm"
            >
              Save Beneficiary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
