import {
  Customer,
  Account,
  Transaction,
  Transfer,
  Beneficiary,
  AuditLog,
  Employee,
  BankSettings,
  UserRole
} from '../types';

const STORAGE_KEY = 'bankpro_db_state_v2';

interface DatabaseState {
  customers: Customer[];
  accounts: Account[];
  transactions: Transaction[];
  transfers: Transfer[];
  beneficiaries: Beneficiary[];
  auditLogs: AuditLog[];
  employees: Employee[];
  settings: BankSettings;
}

const DEFAULT_SETTINGS: BankSettings = {
  minSavingsBalance: 500.0,
  minCurrentBalance: 0.0,
  dailyTransferLimit: 50000.0,
  suspiciousTxThreshold: 10000.0,
};

const INITIAL_CUSTOMERS: Customer[] = [
  {
    customerID: 1001,
    fullName: 'Alice Henderson',
    dateOfBirth: '1990-04-12',
    gender: 'Female',
    email: 'alice@example.com',
    phone: '+1 (555) 123-4567',
    address: '452 Elm Street',
    city: 'Metropolis',
    state: 'NY',
    pinCode: '10001',
    createdAt: '2024-01-15T09:30:00Z',
  },
  {
    customerID: 1002,
    fullName: 'Bob Alexander',
    dateOfBirth: '1985-08-23',
    gender: 'Male',
    email: 'bob@example.com',
    phone: '+1 (555) 987-6543',
    address: '789 Oak Avenue',
    city: 'Gotham',
    state: 'NJ',
    pinCode: '07001',
    createdAt: '2024-02-10T14:15:00Z',
  },
  {
    customerID: 1003,
    fullName: 'Catherine Vance',
    dateOfBirth: '1993-11-05',
    gender: 'Female',
    email: 'catherine@example.com',
    phone: '+1 (555) 432-8765',
    address: '120 Riverside Blvd',
    city: 'Star City',
    state: 'CA',
    pinCode: '90210',
    createdAt: '2024-03-01T11:00:00Z',
  },
  {
    customerID: 1004,
    fullName: 'Daniel Kim',
    dateOfBirth: '1998-02-18',
    gender: 'Male',
    email: 'daniel.kim@example.com',
    phone: '+1 (555) 345-6789',
    address: '88 Tech Way',
    city: 'Seattle',
    state: 'WA',
    pinCode: '98101',
    createdAt: '2024-04-10T16:20:00Z',
  },
];

const INITIAL_ACCOUNTS: Account[] = [
  {
    accountID: 1,
    customerID: 1001,
    accountNumber: 'BPRO10010001',
    accountType: 'SAVINGS',
    balance: 15500.0,
    accountStatus: 'ACTIVE',
    createdAt: '2024-01-15T09:30:00Z',
    minBalance: 500.0,
  },
  {
    accountID: 2,
    customerID: 1001,
    accountNumber: 'BPRO10010002',
    accountType: 'CURRENT',
    balance: 3200.0,
    accountStatus: 'ACTIVE',
    createdAt: '2024-02-20T10:00:00Z',
    minBalance: 0.0,
  },
  {
    accountID: 3,
    customerID: 1002,
    accountNumber: 'BPRO10020002',
    accountType: 'CURRENT',
    balance: 4200.0,
    accountStatus: 'ACTIVE',
    createdAt: '2024-02-10T14:15:00Z',
    minBalance: 0.0,
  },
  {
    accountID: 4,
    customerID: 1003,
    accountNumber: 'BPRO10030003',
    accountType: 'SAVINGS',
    balance: 8750.0,
    accountStatus: 'ACTIVE',
    createdAt: '2024-03-01T11:00:00Z',
    minBalance: 500.0,
  },
  {
    accountID: 5,
    customerID: 1004,
    accountNumber: 'BPRO10040004',
    accountType: 'SAVINGS',
    balance: 1200.0,
    accountStatus: 'PENDING',
    createdAt: '2024-04-10T16:20:00Z',
    minBalance: 500.0,
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    employeeID: 501,
    employeeName: 'Sarah Connor',
    email: 'sconnor@bankpro.internal',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2023-01-10T08:00:00Z',
  },
  {
    employeeID: 502,
    employeeName: 'David Miller',
    email: 'dmiller@bankpro.internal',
    role: 'TELLER',
    status: 'ACTIVE',
    createdAt: '2023-05-15T08:30:00Z',
  },
  {
    employeeID: 503,
    employeeName: 'Marcus Vance',
    email: 'mvance@bankpro.internal',
    role: 'BRANCH_MANAGER',
    status: 'ACTIVE',
    createdAt: '2023-06-01T09:00:00Z',
  },
];

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  {
    beneficiaryID: 1,
    customerID: 1001,
    beneficiaryAccountNumber: 'BPRO10020002',
    beneficiaryName: 'Bob Alexander',
    createdAt: '2024-02-15T10:00:00Z',
  },
  {
    beneficiaryID: 2,
    customerID: 1001,
    beneficiaryAccountNumber: 'BPRO10030003',
    beneficiaryName: 'Catherine Vance',
    createdAt: '2024-03-05T12:00:00Z',
  },
  {
    beneficiaryID: 3,
    customerID: 1002,
    beneficiaryAccountNumber: 'BPRO10010001',
    beneficiaryName: 'Alice Henderson',
    createdAt: '2024-02-16T09:00:00Z',
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    transactionID: 100001,
    transactionReference: 'TX-INIT-100101',
    accountID: 1,
    transactionType: 'DEPOSIT',
    amount: 10000.0,
    runningBalance: 10000.0,
    transactionDate: '2024-01-15T09:35:00Z',
    description: 'Initial Opening Deposit',
    status: 'COMPLETED',
  },
  {
    transactionID: 100002,
    transactionReference: 'TX-DEP-240120-01',
    accountID: 1,
    transactionType: 'DEPOSIT',
    amount: 3500.0,
    runningBalance: 13500.0,
    transactionDate: '2024-01-20T14:10:00Z',
    description: 'Payroll Direct Deposit - Acme Corp',
    status: 'COMPLETED',
  },
  {
    transactionID: 100003,
    transactionReference: 'TX-WTH-240125-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 800.0,
    runningBalance: 12700.0,
    transactionDate: '2024-01-25T11:22:00Z',
    description: 'ATM Cash Withdrawal - Main St Branch',
    status: 'COMPLETED',
  },
  {
    transactionID: 100004,
    transactionReference: 'TX-DEP-240201-01',
    accountID: 1,
    transactionType: 'DEPOSIT',
    amount: 4000.0,
    runningBalance: 16700.0,
    transactionDate: '2024-02-01T09:00:00Z',
    description: 'Consulting Fee Wire Transfer',
    status: 'COMPLETED',
  },
  {
    transactionID: 100005,
    transactionReference: 'TX-INIT-100201',
    accountID: 3,
    transactionType: 'DEPOSIT',
    amount: 5000.0,
    runningBalance: 5000.0,
    transactionDate: '2024-02-10T14:20:00Z',
    description: 'Initial Business Capital Deposit',
    status: 'COMPLETED',
  },
  {
    transactionID: 100006,
    transactionReference: 'TRF-DR-240215-01',
    accountID: 1,
    transactionType: 'TRANSFER_DR',
    amount: 1200.0,
    runningBalance: 15500.0,
    transactionDate: '2024-02-15T15:40:00Z',
    description: 'Transfer to BPRO10020002 - Web Services',
    status: 'COMPLETED',
  },
  {
    transactionID: 100007,
    transactionReference: 'TRF-CR-240215-01',
    accountID: 3,
    transactionType: 'TRANSFER_CR',
    amount: 1200.0,
    runningBalance: 6200.0,
    transactionDate: '2024-02-15T15:40:00Z',
    description: 'Transfer from BPRO10010001 - Web Services',
    status: 'COMPLETED',
  },
  {
    transactionID: 100008,
    transactionReference: 'TX-WTH-240228-01',
    accountID: 3,
    transactionType: 'WITHDRAWAL',
    amount: 2000.0,
    runningBalance: 4200.0,
    transactionDate: '2024-02-28T16:00:00Z',
    description: 'Commercial Vendor Equipment Payment',
    status: 'COMPLETED',
  },
  {
    transactionID: 100009,
    transactionReference: 'TX-INIT-100301',
    accountID: 4,
    transactionType: 'DEPOSIT',
    amount: 8750.0,
    runningBalance: 8750.0,
    transactionDate: '2024-03-01T11:05:00Z',
    description: 'Personal Savings Opening Deposit',
    status: 'COMPLETED',
  },
  {
    transactionID: 100010,
    transactionReference: 'TX-INIT-100102',
    accountID: 2,
    transactionType: 'DEPOSIT',
    amount: 3200.0,
    runningBalance: 3200.0,
    transactionDate: '2024-02-20T10:05:00Z',
    description: 'Secondary Current Account Seed',
    status: 'COMPLETED',
  },
  // Categorized Outflows for Spending Trends (Rent, Utilities, Groceries, Dining, Transport, Shopping)
  {
    transactionID: 100011,
    transactionReference: 'TX-WTH-240105-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 1450.0,
    runningBalance: 12050.0,
    transactionDate: '2024-01-05T10:00:00Z',
    description: 'Apartment Monthly Rent Payment - Plaza Tower',
    status: 'COMPLETED',
  },
  {
    transactionID: 100012,
    transactionReference: 'TX-WTH-240112-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 165.0,
    runningBalance: 11885.0,
    transactionDate: '2024-01-12T14:30:00Z',
    description: 'ConEd Electric & Power Utilities Bill',
    status: 'COMPLETED',
  },
  {
    transactionID: 100013,
    transactionReference: 'TX-WTH-240118-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 210.0,
    runningBalance: 11675.0,
    transactionDate: '2024-01-18T16:15:00Z',
    description: 'Whole Foods Market Weekly Groceries',
    status: 'COMPLETED',
  },
  {
    transactionID: 100014,
    transactionReference: 'TX-WTH-240122-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 85.0,
    runningBalance: 11590.0,
    transactionDate: '2024-01-22T09:00:00Z',
    description: 'High-Speed Broadband Internet Utilities',
    status: 'COMPLETED',
  },
  {
    transactionID: 100015,
    transactionReference: 'TX-WTH-240205-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 1450.0,
    runningBalance: 15250.0,
    transactionDate: '2024-02-05T10:00:00Z',
    description: 'Apartment Monthly Rent Payment - Plaza Tower',
    status: 'COMPLETED',
  },
  {
    transactionID: 100016,
    transactionReference: 'TX-WTH-240209-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 180.0,
    runningBalance: 15070.0,
    transactionDate: '2024-02-09T18:20:00Z',
    description: 'ConEd Power & Heating Utilities',
    status: 'COMPLETED',
  },
  {
    transactionID: 100017,
    transactionReference: 'TX-WTH-240214-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 245.0,
    runningBalance: 14825.0,
    transactionDate: '2024-02-14T15:00:00Z',
    description: 'Trader Joe Supermarket Groceries',
    status: 'COMPLETED',
  },
  {
    transactionID: 100018,
    transactionReference: 'TX-WTH-240219-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 125.0,
    runningBalance: 14700.0,
    transactionDate: '2024-02-19T20:30:00Z',
    description: 'Bistro Dining & Evening Entertainment',
    status: 'COMPLETED',
  },
  {
    transactionID: 100019,
    transactionReference: 'TX-WTH-240224-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 110.0,
    runningBalance: 14590.0,
    transactionDate: '2024-02-24T08:45:00Z',
    description: 'Metro Subway Monthly Transit Pass',
    status: 'COMPLETED',
  },
  {
    transactionID: 100020,
    transactionReference: 'TX-WTH-240305-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 1450.0,
    runningBalance: 13140.0,
    transactionDate: '2024-03-05T10:00:00Z',
    description: 'Apartment Monthly Rent Payment - Plaza Tower',
    status: 'COMPLETED',
  },
  {
    transactionID: 100021,
    transactionReference: 'TX-WTH-240311-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 295.0,
    runningBalance: 12845.0,
    transactionDate: '2024-03-11T12:30:00Z',
    description: 'Whole Foods Market Organic Groceries',
    status: 'COMPLETED',
  },
  {
    transactionID: 100022,
    transactionReference: 'TX-WTH-240316-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 145.0,
    runningBalance: 12700.0,
    transactionDate: '2024-03-16T17:15:00Z',
    description: 'Municipal Water & Power Utilities',
    status: 'COMPLETED',
  },
  {
    transactionID: 100023,
    transactionReference: 'TX-WTH-240321-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 85.0,
    runningBalance: 12615.0,
    transactionDate: '2024-03-21T11:00:00Z',
    description: 'Pharmacy Prescription Healthcare',
    status: 'COMPLETED',
  },
  {
    transactionID: 100024,
    transactionReference: 'TX-WTH-240405-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 1450.0,
    runningBalance: 11165.0,
    transactionDate: '2024-04-05T10:00:00Z',
    description: 'Apartment Monthly Rent Payment - Plaza Tower',
    status: 'COMPLETED',
  },
  {
    transactionID: 100025,
    transactionReference: 'TX-WTH-240410-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 275.0,
    runningBalance: 10890.0,
    transactionDate: '2024-04-10T14:40:00Z',
    description: 'Supermarket Groceries & Household Essentials',
    status: 'COMPLETED',
  },
  {
    transactionID: 100026,
    transactionReference: 'TX-WTH-240415-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 160.0,
    runningBalance: 10730.0,
    transactionDate: '2024-04-15T19:10:00Z',
    description: 'ConEd Power Electric Utilities',
    status: 'COMPLETED',
  },
  {
    transactionID: 100027,
    transactionReference: 'TX-WTH-240420-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 195.0,
    runningBalance: 10535.0,
    transactionDate: '2024-04-20T16:00:00Z',
    description: 'Amazon Retail Shopping Equipment',
    status: 'COMPLETED',
  },
  {
    transactionID: 100028,
    transactionReference: 'TX-WTH-240425-01',
    accountID: 1,
    transactionType: 'WITHDRAWAL',
    amount: 95.0,
    runningBalance: 10440.0,
    transactionDate: '2024-04-25T13:30:00Z',
    description: 'Cafe Restaurant Dining Lunch',
    status: 'COMPLETED',
  },
];

const INITIAL_TRANSFERS: Transfer[] = [
  {
    transferID: 1,
    senderAccountID: 1,
    receiverAccountID: 3,
    amount: 1200.0,
    referenceNumber: 'REF-TRF-240215-881',
    transferDate: '2024-02-15T15:40:00Z',
    transferStatus: 'SUCCESS',
    notes: 'Web Services Settlement',
    senderAccountNum: 'BPRO10010001',
    receiverAccountNum: 'BPRO10020002',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    logID: 1,
    userID: 'ADM-501',
    userRole: 'ADMIN',
    action: 'SYSTEM_BOOTSTRAP',
    ipAddress: '127.0.0.1',
    timestamp: '2024-01-01T00:00:00Z',
    description: 'BankPro core banking engine and ledger initialized with ACID snapshot isolation.',
  },
  {
    logID: 2,
    userID: 'EMP-502',
    userRole: 'EMPLOYEE',
    action: 'CUSTOMER_ONBOARDED',
    ipAddress: '192.168.1.45',
    timestamp: '2024-01-15T09:30:00Z',
    description: 'Verified KYC and provisioned Savings Account BPRO10010001 for Alice Henderson.',
  },
  {
    logID: 3,
    userID: 'CUST-1001',
    userRole: 'CUSTOMER',
    action: 'P2P_TRANSFER',
    ipAddress: '10.0.0.12',
    timestamp: '2024-02-15T15:40:00Z',
    description: 'Executed atomic transfer of $1,200.00 to BPRO10020002. Ref: REF-TRF-240215-881.',
  },
];

class BankDatabaseStore {
  private state: DatabaseState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DatabaseState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      customers: INITIAL_CUSTOMERS,
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      transfers: INITIAL_TRANSFERS,
      beneficiaries: INITIAL_BENEFICIARIES,
      auditLogs: INITIAL_AUDIT_LOGS,
      employees: INITIAL_EMPLOYEES,
      settings: DEFAULT_SETTINGS,
    };
  }

  private persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Getters
  public getCustomers(): Customer[] {
    return [...this.state.customers];
  }

  public getAccounts(): Account[] {
    return [...this.state.accounts];
  }

  public getTransactions(): Transaction[] {
    return [...this.state.transactions];
  }

  public getTransfers(): Transfer[] {
    return [...this.state.transfers];
  }

  public getBeneficiaries(customerID?: number): Beneficiary[] {
    if (customerID) {
      return this.state.beneficiaries.filter((b) => b.customerID === customerID);
    }
    return [...this.state.beneficiaries];
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.state.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getEmployees(): Employee[] {
    return [...this.state.employees];
  }

  public getSettings(): BankSettings {
    return { ...this.state.settings };
  }

  public getCustomerById(id: number): Customer | undefined {
    return this.state.customers.find((c) => c.customerID === id);
  }

  public getAccountsByCustomerId(customerId: number): Account[] {
    return this.state.accounts.filter((a) => a.customerID === customerId);
  }

  public getAccountByNumber(accountNumber: string): Account | undefined {
    return this.state.accounts.find(
      (a) => a.accountNumber.trim().toUpperCase() === accountNumber.trim().toUpperCase()
    );
  }

  public getTransactionsByAccountId(accountId: number): Transaction[] {
    return this.state.transactions
      .filter((t) => t.accountID === accountId)
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  public getCustomerTransactions(customerId: number): Transaction[] {
    const accIds = this.getAccountsByCustomerId(customerId).map((a) => a.accountID);
    return this.state.transactions
      .filter((t) => accIds.includes(t.accountID))
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }

  // Transaction Engine (ACID Operations with Lock & Rollback simulation)
  public deposit(
    accountNumber: string,
    amount: number,
    description: string,
    actor: { id: string; role: UserRole; name: string }
  ): { success: boolean; message: string; transaction?: Transaction } {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Deposit amount must be strictly greater than $0.00.' };
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const accountIndex = this.state.accounts.findIndex(
      (a) => a.accountNumber.trim().toUpperCase() === accountNumber.trim().toUpperCase()
    );

    if (accountIndex === -1) {
      return { success: false, message: `Account "${accountNumber}" was not found in BankPro registry.` };
    }

    const targetAccount = this.state.accounts[accountIndex];
    if (targetAccount.accountStatus !== 'ACTIVE') {
      return {
        success: false,
        message: `Account is currently ${targetAccount.accountStatus}. Only ACTIVE accounts can accept funds.`,
      };
    }

    // ACID Mutation
    const newBalance = Math.round((targetAccount.balance + roundedAmount) * 100) / 100;
    this.state.accounts[accountIndex] = {
      ...targetAccount,
      balance: newBalance,
    };

    const txRef = `DEP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const newTx: Transaction = {
      transactionID: this.state.transactions.length + 100001,
      transactionReference: txRef,
      accountID: targetAccount.accountID,
      transactionType: 'DEPOSIT',
      amount: roundedAmount,
      runningBalance: newBalance,
      transactionDate: new Date().toISOString(),
      description: description || 'Over-the-counter Cash Deposit',
      status: 'COMPLETED',
    };

    this.state.transactions.unshift(newTx);

    // Audit Log
    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'DEPOSIT_PROCESSED',
      ipAddress: '192.168.1.100',
      description: `Deposited $${roundedAmount.toFixed(2)} to ${targetAccount.accountNumber}. New balance: $${newBalance.toFixed(2)}. Ref: ${txRef}`,
    });

    this.persistState();
    return { success: true, message: `Successfully deposited $${roundedAmount.toFixed(2)} to ${targetAccount.accountNumber}.`, transaction: newTx };
  }

  public withdraw(
    accountNumber: string,
    amount: number,
    description: string,
    actor: { id: string; role: UserRole; name: string }
  ): { success: boolean; message: string; transaction?: Transaction } {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Withdrawal amount must be strictly greater than $0.00.' };
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    const accountIndex = this.state.accounts.findIndex(
      (a) => a.accountNumber.trim().toUpperCase() === accountNumber.trim().toUpperCase()
    );

    if (accountIndex === -1) {
      return { success: false, message: `Account "${accountNumber}" not found.` };
    }

    const targetAccount = this.state.accounts[accountIndex];
    if (targetAccount.accountStatus !== 'ACTIVE') {
      return {
        success: false,
        message: `Account is ${targetAccount.accountStatus}. Debits are not permitted.`,
      };
    }

    const requiredFloor = targetAccount.accountType === 'SAVINGS' ? targetAccount.minBalance : 0.0;
    const available = targetAccount.balance - requiredFloor;

    if (roundedAmount > available) {
      return {
        success: false,
        message: `Insufficient cleared funds. Account requires a minimum reserve of $${requiredFloor.toFixed(2)}. Max withdrawable: $${Math.max(0, available).toFixed(2)}.`,
      };
    }

    // ACID Mutation
    const newBalance = Math.round((targetAccount.balance - roundedAmount) * 100) / 100;
    this.state.accounts[accountIndex] = {
      ...targetAccount,
      balance: newBalance,
    };

    const txRef = `WTH-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const newTx: Transaction = {
      transactionID: this.state.transactions.length + 100001,
      transactionReference: txRef,
      accountID: targetAccount.accountID,
      transactionType: 'WITHDRAWAL',
      amount: roundedAmount,
      runningBalance: newBalance,
      transactionDate: new Date().toISOString(),
      description: description || 'Atm Counter Withdrawal',
      status: 'COMPLETED',
    };

    this.state.transactions.unshift(newTx);

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'WITHDRAWAL_PROCESSED',
      ipAddress: '192.168.1.100',
      description: `Withdrew $${roundedAmount.toFixed(2)} from ${targetAccount.accountNumber}. Remaining balance: $${newBalance.toFixed(2)}. Ref: ${txRef}`,
    });

    this.persistState();
    return { success: true, message: `Withdrawal of $${roundedAmount.toFixed(2)} completed successfully.`, transaction: newTx };
  }

  // Atomic P2P Fund Transfer with Double-Entry Bookkeeping
  public transfer(
    senderAccNumber: string,
    receiverAccNumber: string,
    amount: number,
    notes: string,
    actor: { id: string; role: UserRole; name: string }
  ): { success: boolean; message: string; transfer?: Transfer } {
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Transfer amount must be strictly greater than zero.' };
    }

    if (senderAccNumber.trim().toUpperCase() === receiverAccNumber.trim().toUpperCase()) {
      return { success: false, message: 'Self-transfers between identical accounts are not permitted.' };
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    if (roundedAmount > this.state.settings.dailyTransferLimit) {
      return {
        success: false,
        message: `Amount exceeds the daily transfer limit threshold of $${this.state.settings.dailyTransferLimit.toLocaleString()}.`,
      };
    }

    const senderIdx = this.state.accounts.findIndex(
      (a) => a.accountNumber.trim().toUpperCase() === senderAccNumber.trim().toUpperCase()
    );
    const receiverIdx = this.state.accounts.findIndex(
      (a) => a.accountNumber.trim().toUpperCase() === receiverAccNumber.trim().toUpperCase()
    );

    if (senderIdx === -1) {
      return { success: false, message: `Source account ${senderAccNumber} does not exist.` };
    }
    if (receiverIdx === -1) {
      return { success: false, message: `Beneficiary account ${receiverAccNumber} does not exist in BankPro.` };
    }

    const sender = this.state.accounts[senderIdx];
    const receiver = this.state.accounts[receiverIdx];

    if (sender.accountStatus !== 'ACTIVE') {
      return { success: false, message: `Source account is ${sender.accountStatus}.` };
    }
    if (receiver.accountStatus !== 'ACTIVE') {
      return { success: false, message: `Beneficiary account is ${receiver.accountStatus}. Transfer rejected.` };
    }

    const senderFloor = sender.accountType === 'SAVINGS' ? sender.minBalance : 0.0;
    if (sender.balance - roundedAmount < senderFloor) {
      return {
        success: false,
        message: `Insufficient cleared funds. Savings accounts must maintain minimum $${senderFloor.toFixed(2)} balance. Available: $${Math.max(0, sender.balance - senderFloor).toFixed(2)}.`,
      };
    }

    // Atomic Balance Mutation
    const senderNewBal = Math.round((sender.balance - roundedAmount) * 100) / 100;
    const receiverNewBal = Math.round((receiver.balance + roundedAmount) * 100) / 100;

    this.state.accounts[senderIdx] = { ...sender, balance: senderNewBal };
    this.state.accounts[receiverIdx] = { ...receiver, balance: receiverNewBal };

    const refNumber = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const nowIso = new Date().toISOString();

    const transferRecord: Transfer = {
      transferID: this.state.transfers.length + 1,
      senderAccountID: sender.accountID,
      receiverAccountID: receiver.accountID,
      amount: roundedAmount,
      referenceNumber: refNumber,
      transferDate: nowIso,
      transferStatus: 'SUCCESS',
      notes: notes || 'Instant BankPro Peer Transfer',
      senderAccountNum: sender.accountNumber,
      receiverAccountNum: receiver.accountNumber,
    };

    this.state.transfers.unshift(transferRecord);

    // Double-Entry Ledger Transactions (Debit for Sender, Credit for Receiver)
    const drTx: Transaction = {
      transactionID: this.state.transactions.length + 100001,
      transactionReference: `DR-${refNumber.slice(4)}`,
      accountID: sender.accountID,
      transactionType: 'TRANSFER_DR',
      amount: roundedAmount,
      runningBalance: senderNewBal,
      transactionDate: nowIso,
      description: `Transfer to ${receiver.accountNumber}${notes ? ` - ${notes}` : ''}`,
      status: 'COMPLETED',
    };

    const crTx: Transaction = {
      transactionID: this.state.transactions.length + 100002,
      transactionReference: `CR-${refNumber.slice(4)}`,
      accountID: receiver.accountID,
      transactionType: 'TRANSFER_CR',
      amount: roundedAmount,
      runningBalance: receiverNewBal,
      transactionDate: nowIso,
      description: `Transfer received from ${sender.accountNumber}${notes ? ` - ${notes}` : ''}`,
      status: 'COMPLETED',
    };

    this.state.transactions.unshift(drTx, crTx);

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'ATOMIC_TRANSFER_SETTLED',
      ipAddress: '192.168.1.100',
      description: `Atomic transfer of $${roundedAmount.toFixed(2)} from ${sender.accountNumber} to ${receiver.accountNumber}. Ref: ${refNumber}.`,
    });

    this.persistState();
    return {
      success: true,
      message: `Instant transfer of $${roundedAmount.toFixed(2)} to ${receiver.accountNumber} completed successfully. Reference: ${refNumber}`,
      transfer: transferRecord,
    };
  }

  // Administrative & Employee operations
  public approveAccount(accountID: number, actor: { id: string; role: UserRole }): boolean {
    const idx = this.state.accounts.findIndex((a) => a.accountID === accountID);
    if (idx === -1) return false;

    const acc = this.state.accounts[idx];
    this.state.accounts[idx] = { ...acc, accountStatus: 'ACTIVE' };

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'ACCOUNT_APPROVED',
      ipAddress: '10.0.1.20',
      description: `Approved application and activated Account ${acc.accountNumber}.`,
    });

    this.persistState();
    return true;
  }

  public rejectAccount(accountID: number, actor: { id: string; role: UserRole }): boolean {
    const idx = this.state.accounts.findIndex((a) => a.accountID === accountID);
    if (idx === -1) return false;

    const acc = this.state.accounts[idx];
    this.state.accounts[idx] = { ...acc, accountStatus: 'CLOSED' };

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'ACCOUNT_REJECTED',
      ipAddress: '10.0.1.20',
      description: `Rejected and closed application for Account ${acc.accountNumber}.`,
    });

    this.persistState();
    return true;
  }

  public freezeAccount(accountID: number, reason: string, actor: { id: string; role: UserRole }): boolean {
    const idx = this.state.accounts.findIndex((a) => a.accountID === accountID);
    if (idx === -1) return false;

    const acc = this.state.accounts[idx];
    this.state.accounts[idx] = { ...acc, accountStatus: 'FROZEN' };

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'ACCOUNT_FROZEN',
      ipAddress: '10.0.1.20',
      description: `Account ${acc.accountNumber} frozen by ${actor.role}. Reason: ${reason || 'Security review'}.`,
    });

    this.persistState();
    return true;
  }

  public unfreezeAccount(accountID: number, actor: { id: string; role: UserRole }): boolean {
    const idx = this.state.accounts.findIndex((a) => a.accountID === accountID);
    if (idx === -1) return false;

    const acc = this.state.accounts[idx];
    this.state.accounts[idx] = { ...acc, accountStatus: 'ACTIVE' };

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'ACCOUNT_UNFROZEN',
      ipAddress: '10.0.1.20',
      description: `Account ${acc.accountNumber} unfrozen and returned to ACTIVE status.`,
    });

    this.persistState();
    return true;
  }

  // Customer Onboarding & Registration
  public registerCustomer(
    data: Omit<Customer, 'customerID' | 'createdAt'>,
    initialDeposit: number,
    accountType: 'SAVINGS' | 'CURRENT'
  ): { customer: Customer; account: Account } {
    const newCustomerID = 1000 + this.state.customers.length + 1;
    const nowIso = new Date().toISOString();

    const newCustomer: Customer = {
      ...data,
      customerID: newCustomerID,
      createdAt: nowIso,
    };

    const newAccID = this.state.accounts.length + 1;
    const newAccNumber = `BPRO${newCustomerID}${newAccID.toString().padStart(4, '0')}`;
    const minBal = accountType === 'SAVINGS' ? 500.0 : 0.0;

    const newAccount: Account = {
      accountID: newAccID,
      customerID: newCustomerID,
      accountNumber: newAccNumber,
      accountType,
      balance: initialDeposit,
      accountStatus: 'ACTIVE',
      createdAt: nowIso,
      minBalance: minBal,
    };

    this.state.customers.push(newCustomer);
    this.state.accounts.push(newAccount);

    if (initialDeposit > 0) {
      const txRef = `DEP-INIT-${newAccNumber.slice(4)}`;
      this.state.transactions.unshift({
        transactionID: this.state.transactions.length + 100001,
        transactionReference: txRef,
        accountID: newAccID,
        transactionType: 'DEPOSIT',
        amount: initialDeposit,
        runningBalance: initialDeposit,
        transactionDate: nowIso,
        description: 'Initial Opening Account Balance Deposit',
        status: 'COMPLETED',
      });
    }

    this.logAudit({
      userID: `CUST-${newCustomerID}`,
      userRole: 'CUSTOMER',
      action: 'CUSTOMER_REGISTERED',
      ipAddress: '127.0.0.1',
      description: `Registered new customer ${data.fullName} with ${accountType} account ${newAccNumber} ($${initialDeposit.toFixed(2)} deposit).`,
    });

    this.persistState();
    return { customer: newCustomer, account: newAccount };
  }

  public createAccountForExistingCustomer(
    customerID: number,
    accountType: 'SAVINGS' | 'CURRENT',
    initialDeposit: number,
    actor: { id: string; role: UserRole }
  ): Account {
    const customer = this.getCustomerById(customerID);
    if (!customer) throw new Error('Customer does not exist');

    const newAccID = this.state.accounts.length + 1;
    const newAccNumber = `BPRO${customerID}${newAccID.toString().padStart(4, '0')}`;
    const minBal = accountType === 'SAVINGS' ? 500.0 : 0.0;
    const nowIso = new Date().toISOString();

    const newAccount: Account = {
      accountID: newAccID,
      customerID,
      accountNumber: newAccNumber,
      accountType,
      balance: initialDeposit,
      accountStatus: 'ACTIVE',
      createdAt: nowIso,
      minBalance: minBal,
    };

    this.state.accounts.push(newAccount);

    if (initialDeposit > 0) {
      this.state.transactions.unshift({
        transactionID: this.state.transactions.length + 100001,
        transactionReference: `DEP-NEW-${newAccNumber.slice(4)}`,
        accountID: newAccID,
        transactionType: 'DEPOSIT',
        amount: initialDeposit,
        runningBalance: initialDeposit,
        transactionDate: nowIso,
        description: `Initial Seed for ${accountType} Account`,
        status: 'COMPLETED',
      });
    }

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'ADDITIONAL_ACCOUNT_PROVISIONED',
      ipAddress: '192.168.1.100',
      description: `Provisioned secondary ${accountType} account ${newAccNumber} for ${customer.fullName}.`,
    });

    this.persistState();
    return newAccount;
  }

  public addBeneficiary(customerID: number, accountNumber: string, beneficiaryName: string): boolean {
    const exists = this.state.beneficiaries.some(
      (b) => b.customerID === customerID && b.beneficiaryAccountNumber.toUpperCase() === accountNumber.toUpperCase()
    );
    if (exists) return false;

    this.state.beneficiaries.push({
      beneficiaryID: this.state.beneficiaries.length + 1,
      customerID,
      beneficiaryAccountNumber: accountNumber.toUpperCase(),
      beneficiaryName,
      createdAt: new Date().toISOString(),
    });

    this.persistState();
    return true;
  }

  public addEmployee(
    data: { employeeName: string; email: string; role: 'TELLER' | 'BRANCH_MANAGER' | 'AUDITOR' },
    actor: { id: string; role: UserRole }
  ): Employee {
    const newEmp: Employee = {
      employeeID: 500 + this.state.employees.length + 1,
      employeeName: data.employeeName,
      email: data.email,
      role: data.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.state.employees.push(newEmp);

    this.logAudit({
      userID: actor.id,
      userRole: actor.role,
      action: 'EMPLOYEE_PROVISIONED',
      ipAddress: '10.0.1.20',
      description: `Provisioned employee ${data.employeeName} (${data.role}) with ID ${newEmp.employeeID}.`,
    });

    this.persistState();
    return newEmp;
  }

  public toggleEmployeeStatus(employeeID: number, actor: { id: string; role: UserRole }): void {
    const idx = this.state.employees.findIndex((e) => e.employeeID === employeeID);
    if (idx !== -1) {
      const emp = this.state.employees[idx];
      const newStatus = emp.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      this.state.employees[idx] = { ...emp, status: newStatus };

      this.logAudit({
        userID: actor.id,
        userRole: actor.role,
        action: 'EMPLOYEE_STATUS_CHANGED',
        ipAddress: '10.0.1.20',
        description: `Employee ${emp.employeeName} status updated to ${newStatus}.`,
      });

      this.persistState();
    }
  }

  public resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      customers: INITIAL_CUSTOMERS,
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      transfers: INITIAL_TRANSFERS,
      beneficiaries: INITIAL_BENEFICIARIES,
      auditLogs: INITIAL_AUDIT_LOGS,
      employees: INITIAL_EMPLOYEES,
      settings: DEFAULT_SETTINGS,
    };
    this.persistState();
  }

  private logAudit(entry: Omit<AuditLog, 'logID' | 'timestamp'>) {
    const log: AuditLog = {
      logID: this.state.auditLogs.length + 1,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.state.auditLogs.unshift(log);
  }
}

export const bankStore = new BankDatabaseStore();
