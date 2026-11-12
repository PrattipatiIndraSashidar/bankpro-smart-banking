import React, { useState } from 'react';
import { Account, Customer, Transaction } from '../../types';
import { bankStore } from '../../services/bankStore';
import { FileText, Download, Printer, X, Filter } from 'lucide-react';

interface StatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  accounts: Account[];
}

export const StatementModal: React.FC<StatementModalProps> = ({
  isOpen,
  onClose,
  customer,
  accounts,
}) => {
  const [selectedAccNum, setSelectedAccNum] = useState<string>(accounts[0]?.accountNumber || '');
  const [dateFilter, setDateFilter] = useState<'30' | '90' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.accountNumber === selectedAccNum) || accounts[0];
  const allAccountTxs = currentAccount ? bankStore.getTransactionsByAccountId(currentAccount.accountID) : [];

  const filteredTxs = allAccountTxs.filter((tx) => {
    // Type filter
    if (typeFilter !== 'ALL' && tx.transactionType !== typeFilter) {
      return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (new Date(tx.transactionDate) < cutoff) return false;
    }

    return true;
  });

  const totalInflow = filteredTxs
    .filter((t) => t.transactionType === 'DEPOSIT' || t.transactionType === 'TRANSFER_CR')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = filteredTxs
    .filter((t) => t.transactionType === 'WITHDRAWAL' || t.transactionType === 'TRANSFER_DR')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDownloadCsv = () => {
    if (!currentAccount) return;

    const headers = ['Transaction Reference', 'Date (UTC)', 'Type', 'Amount ($)', 'Balance ($)', 'Description', 'Status'];
    const rows = filteredTxs.map((tx) => [
      `"${tx.transactionReference}"`,
      `"${new Date(tx.transactionDate).toISOString().replace('T', ' ').substring(0, 19)}"`,
      `"${tx.transactionType}"`,
      tx.amount.toFixed(2),
      tx.runningBalance.toFixed(2),
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BankPro_Statement_${currentAccount.accountNumber}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base font-display">Official Account Statement</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar (hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs no-print">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-500 mr-2">Account:</span>
              <select
                value={selectedAccNum}
                onChange={(e) => setSelectedAccNum(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white font-mono"
              >
                {accounts.map((acc) => (
                  <option key={acc.accountID} value={acc.accountNumber}>
                    {acc.accountNumber} ({acc.accountType} - ${acc.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-slate-500 mr-2">Period:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="all">Full Statement Period</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            <div>
              <span className="text-slate-500 mr-2">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
              >
                <option value="ALL">All Movements</option>
                <option value="DEPOSIT">Deposits Only</option>
                <option value="WITHDRAWAL">Withdrawals Only</option>
                <option value="TRANSFER_DR">Transfers Sent</option>
                <option value="TRANSFER_CR">Transfers Received</option>
              </select>
            </div>
          </div>

          <div className="text-slate-500 text-[11px]">
            Showing <strong className="text-slate-800">{filteredTxs.length}</strong> matching entries
          </div>
        </div>

        {/* Printable Statement Document */}
        <div className="p-8 max-h-[600px] overflow-y-auto print:max-h-none print:p-0">
          {/* Official Bank Header */}
          <div className="border-b border-slate-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-extrabold text-slate-900 font-display tracking-tight">
                  BANKPRO FINANCIAL SERVICES
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Global Transaction Ledger & Official Statement of Account
                </div>
                <div className="text-xs text-slate-500">
                  Licence #BK-2024-88419 · Member FDIC / Financial Stability Board
                </div>
              </div>
              <div className="text-right text-xs space-y-0.5">
                <div className="font-semibold text-slate-900">Statement Date:</div>
                <div className="text-slate-600 font-mono">{new Date().toLocaleDateString()}</div>
                <div className="text-slate-400 text-[11px]">Ref: STMT-{currentAccount?.accountNumber.slice(4)}-2024</div>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 block">Account Holder:</span>
                <span className="font-bold text-slate-900">{customer.fullName}</span>
                <span className="text-[11px] text-slate-400 block">{customer.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Account Number:</span>
                <span className="font-bold font-mono text-slate-900">{currentAccount?.accountNumber}</span>
                <span className="text-[11px] text-slate-500 block">Type: {currentAccount?.accountType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Current Cleared Balance:</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  ${currentAccount?.balance.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-700 block">Status: {currentAccount?.accountStatus}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Period Cash Flow:</span>
                <span className="font-mono text-emerald-700 block">+${totalInflow.toFixed(2)} (In)</span>
                <span className="font-mono text-rose-700 block">-${totalOutflow.toFixed(2)} (Out)</span>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount ($)</th>
                  <th className="py-2.5 px-3 text-right">Running Balance ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxs.length > 0 ? (
                  filteredTxs.map((tx) => {
                    const isInflow = tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_CR';
                    return (
                      <tr key={tx.transactionID} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {new Date(tx.transactionDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-800">
                          {tx.transactionReference}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{tx.description}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                            isInflow ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                          isInflow ? 'text-emerald-700' : 'text-slate-900'
                        }`}>
                          {isInflow ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                          ${tx.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No transaction records match the specified filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Statement Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-2">
            <div>Generated securely via BankPro Enterprise Core Ledger API</div>
            <div>This statement is computer generated and requires no physical signature.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
