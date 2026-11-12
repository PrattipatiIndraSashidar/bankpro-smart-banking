export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  email: string;
  avatarUrl?: string;
  customerId?: number;
  employeeId?: number;
}

export interface Customer {
  customerID: number;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  createdAt: string;
}

export interface Account {
  accountID: number;
  customerID: number;
  accountNumber: string;
  accountType: 'SAVINGS' | 'CURRENT';
  balance: number;
  accountStatus: 'ACTIVE' | 'FROZEN' | 'CLOSED' | 'PENDING';
  createdAt: string;
  minBalance: number;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_DR' | 'TRANSFER_CR';
export type TransactionStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'REVERSED';

export interface Transaction {
  transactionID: number;
  transactionReference: string;
  accountID: number;
  transactionType: TransactionType;
  amount: number;
  runningBalance: number;
  transactionDate: string;
  description: string;
  status: TransactionStatus;
}

export interface Transfer {
  transferID: number;
  senderAccountID: number;
  receiverAccountID: number;
  amount: number;
  referenceNumber: string;
  transferDate: string;
  transferStatus: 'SUCCESS' | 'FAILED';
  notes: string;
  senderAccountNum?: string;
  receiverAccountNum?: string;
}

export interface Beneficiary {
  beneficiaryID: number;
  customerID: number;
  beneficiaryAccountNumber: string;
  beneficiaryName: string;
  createdAt: string;
}

export interface AuditLog {
  logID: number;
  userID: string;
  userRole: UserRole;
  action: string;
  ipAddress: string;
  timestamp: string;
  description: string;
}

export interface Employee {
  employeeID: number;
  employeeName: string;
  email: string;
  role: 'TELLER' | 'BRANCH_MANAGER' | 'AUDITOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export interface BankSettings {
  minSavingsBalance: number;
  minCurrentBalance: number;
  dailyTransferLimit: number;
  suspiciousTxThreshold: number;
}
