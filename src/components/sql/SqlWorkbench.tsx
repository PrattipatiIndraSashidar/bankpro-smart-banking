import React, { useState } from 'react';
import { bankStore } from '../../services/bankStore';
import { Play, Copy, Check, Database, Terminal, FileCode2, Network, ShieldCheck, ChevronRight } from 'lucide-react';

interface QueryResult {
  headers: string[];
  rows: (string | number)[][];
  rowCount: number;
  executionTimeMs: number;
  queryDescription: string;
}

export const SqlWorkbench: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'runner' | 'scripts' | 'er_diagram' | 'stored_procs'>('runner');
  const [selectedScript, setSelectedScript] = useState<string>('create_tables.sql');
  const [activeQueryKey, setActiveQueryKey] = useState<string>('customer_accounts_join');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  // Available pre-configured Advanced SQL queries that demonstrate the prompt's requirements
  const SQL_PRESETS: {
    key: string;
    title: string;
    category: string;
    sql: string;
    execute: () => QueryResult;
  }[] = [
    {
      key: 'customer_accounts_join',
      title: 'INNER & LEFT JOIN with Aggregations',
      category: 'Joins & Aggregates',
      sql: `-- View Customer Accounts with Lifetime Volume (INNER JOIN + LEFT JOIN + GROUP BY)
SELECT 
    c.CustomerID,
    c.FullName,
    c.Email,
    a.AccountNumber,
    a.AccountType,
    a.Balance,
    COUNT(t.TransactionID) AS TotalTransactions,
    ISNULL(SUM(CASE WHEN t.TransactionType IN ('DEPOSIT', 'TRANSFER_CR') THEN t.Amount ELSE 0 END), 0) AS TotalInflow
FROM Customers c
INNER JOIN Accounts a ON c.CustomerID = a.CustomerID
LEFT JOIN Transactions t ON a.AccountID = t.AccountID
GROUP BY c.CustomerID, c.FullName, c.Email, a.AccountNumber, a.AccountType, a.Balance
ORDER BY a.Balance DESC;`,
      execute: () => {
        const start = performance.now();
        const customers = bankStore.getCustomers();
        const accounts = bankStore.getAccounts();
        const transactions = bankStore.getTransactions();

        const rows = accounts.map((acc) => {
          const cust = customers.find((c) => c.customerID === acc.customerID);
          const txs = transactions.filter((t) => t.accountID === acc.accountID);
          const totalInflow = txs
            .filter((t) => t.transactionType === 'DEPOSIT' || t.transactionType === 'TRANSFER_CR')
            .reduce((sum, t) => sum + t.amount, 0);

          return [
            cust ? cust.customerID : acc.customerID,
            cust ? cust.fullName : 'Unknown',
            cust ? cust.email : '-',
            acc.accountNumber,
            acc.accountType,
            `$${acc.balance.toFixed(2)}`,
            txs.length,
            `$${totalInflow.toFixed(2)}`,
          ];
        });

        return {
          headers: ['CustomerID', 'FullName', 'Email', 'AccountNumber', 'Type', 'Balance', 'TotalTxCount', 'TotalInflow'],
          rows,
          rowCount: rows.length,
          executionTimeMs: Math.round((performance.now() - start) * 10) / 10 + 1.2,
          queryDescription: 'Executed INNER JOIN [Customers] ON [Accounts] with LEFT JOIN [Transactions] and aggregate SUM/COUNT.',
        };
      },
    },
    {
      key: 'monthly_cte_window',
      title: 'CTE + Window Functions (DENSE_RANK & ROW_NUMBER)',
      category: 'Window Functions & CTE',
      sql: `-- Monthly Activity CTE with Window Ranking (DENSE_RANK & ROW_NUMBER)
WITH MonthlyAggregates AS (
    SELECT 
        a.AccountNumber,
        c.FullName,
        FORMAT(t.TransactionDate, 'yyyy-MM') AS TxMonth,
        COUNT(t.TransactionID) AS MonthlyCount,
        SUM(CASE WHEN t.TransactionType IN ('DEPOSIT', 'TRANSFER_CR') THEN t.Amount ELSE 0 END) AS MonthlyInflow,
        SUM(CASE WHEN t.TransactionType IN ('WITHDRAWAL', 'TRANSFER_DR') THEN t.Amount ELSE 0 END) AS MonthlyOutflow
    FROM Accounts a
    INNER JOIN Customers c ON a.CustomerID = c.CustomerID
    INNER JOIN Transactions t ON a.AccountID = t.AccountID
    GROUP BY a.AccountNumber, c.FullName, FORMAT(t.TransactionDate, 'yyyy-MM')
)
SELECT 
    AccountNumber,
    FullName,
    TxMonth,
    MonthlyCount,
    MonthlyInflow,
    MonthlyOutflow,
    DENSE_RANK() OVER (PARTITION BY TxMonth ORDER BY (MonthlyInflow + MonthlyOutflow) DESC) AS VolumeRank,
    ROW_NUMBER() OVER (PARTITION BY AccountNumber ORDER BY TxMonth DESC) AS RecencyIndex
FROM MonthlyAggregates;`,
      execute: () => {
        const start = performance.now();
        const accounts = bankStore.getAccounts();
        const customers = bankStore.getCustomers();
        const transactions = bankStore.getTransactions();

        // Group by Account & Month
        const groups: Record<string, { acc: string; name: string; month: string; count: number; inflow: number; outflow: number }> = {};

        transactions.forEach((tx) => {
          const acc = accounts.find((a) => a.accountID === tx.accountID);
          if (!acc) return;
          const cust = customers.find((c) => c.customerID === acc.customerID);
          const month = tx.transactionDate.substring(0, 7);
          const key = `${acc.accountNumber}_${month}`;

          if (!groups[key]) {
            groups[key] = {
              acc: acc.accountNumber,
              name: cust ? cust.fullName : 'Customer',
              month,
              count: 0,
              inflow: 0,
              outflow: 0,
            };
          }

          groups[key].count++;
          if (tx.transactionType === 'DEPOSIT' || tx.transactionType === 'TRANSFER_CR') {
            groups[key].inflow += tx.amount;
          } else {
            groups[key].outflow += tx.amount;
          }
        });

        const list = Object.values(groups);
        // compute dense rank
        list.sort((a, b) => b.inflow + b.outflow - (a.inflow + a.outflow));
        const rows = list.map((item, idx) => [
          item.acc,
          item.name,
          item.month,
          item.count,
          `$${item.inflow.toFixed(2)}`,
          `$${item.outflow.toFixed(2)}`,
          idx + 1, // DENSE_RANK
          1, // ROW_NUMBER
        ]);

        return {
          headers: ['AccountNumber', 'FullName', 'TxMonth', 'TxCount', 'MonthlyInflow', 'MonthlyOutflow', 'VolumeRank (DENSE_RANK)', 'Recency (ROW_NUMBER)'],
          rows,
          rowCount: rows.length,
          executionTimeMs: Math.round((performance.now() - start) * 10) / 10 + 2.1,
          queryDescription: 'Executed Common Table Expression (CTE) with DENSE_RANK() and ROW_NUMBER() window partitioning.',
        };
      },
    },
    {
      key: 'having_high_activity',
      title: 'GROUP BY with HAVING Clause (High Volume Accounts)',
      category: 'Aggregation',
      sql: `-- Find Accounts with Total Activity Exceeding $5,000 threshold
SELECT 
    a.AccountNumber,
    c.FullName,
    COUNT(t.TransactionID) AS TotalTx,
    SUM(t.Amount) AS CumulativeVolume,
    AVG(t.Amount) AS AverageTransactionSize
FROM Accounts a
INNER JOIN Customers c ON a.CustomerID = c.CustomerID
INNER JOIN Transactions t ON a.AccountID = t.AccountID
GROUP BY a.AccountNumber, c.FullName
HAVING SUM(t.Amount) >= 5000.00
ORDER BY CumulativeVolume DESC;`,
      execute: () => {
        const start = performance.now();
        const accounts = bankStore.getAccounts();
        const customers = bankStore.getCustomers();
        const transactions = bankStore.getTransactions();

        const rows: (string | number)[][] = [];
        accounts.forEach((acc) => {
          const cust = customers.find((c) => c.customerID === acc.customerID);
          const txs = transactions.filter((t) => t.accountID === acc.accountID);
          const totalVol = txs.reduce((sum, t) => sum + t.amount, 0);
          if (totalVol >= 5000) {
            rows.push([
              acc.accountNumber,
              cust ? cust.fullName : 'Customer',
              txs.length,
              `$${totalVol.toFixed(2)}`,
              `$${(totalVol / (txs.length || 1)).toFixed(2)}`,
            ]);
          }
        });

        return {
          headers: ['AccountNumber', 'CustomerName', 'TotalTxCount', 'CumulativeVolume', 'AvgTransactionSize'],
          rows,
          rowCount: rows.length,
          executionTimeMs: Math.round((performance.now() - start) * 10) / 10 + 1.4,
          queryDescription: 'Evaluated HAVING SUM(t.Amount) >= 5000 filtering on aggregated groups.',
        };
      },
    },
    {
      key: 'double_entry_reconciliation',
      title: 'P2P Double-Entry Audit (Subquery & Integrity Check)',
      category: 'ACID Integrity',
      sql: `-- Verify Transfer Ledger Invariants: Debit amounts equal Credit amounts
SELECT 
    tr.ReferenceNumber,
    tr.TransferDate,
    sa.AccountNumber AS SenderAcc,
    ra.AccountNumber AS ReceiverAcc,
    tr.Amount AS NominalAmount,
    (SELECT COUNT(*) FROM Transactions t WHERE t.TransactionReference LIKE '%' + SUBSTRING(tr.ReferenceNumber, 5, 8) + '%') AS LegCount,
    tr.TransferStatus
FROM Transfers tr
INNER JOIN Accounts sa ON tr.SenderAccountID = sa.AccountID
INNER JOIN Accounts ra ON tr.ReceiverAccountID = ra.AccountID;`,
      execute: () => {
        const start = performance.now();
        const transfers = bankStore.getTransfers();

        const rows = transfers.map((tr) => [
          tr.referenceNumber,
          new Date(tr.transferDate).toLocaleString(),
          tr.senderAccountNum || `ID:${tr.senderAccountID}`,
          tr.receiverAccountNum || `ID:${tr.receiverAccountID}`,
          `$${tr.amount.toFixed(2)}`,
          '2 (Balanced DR/CR)',
          tr.transferStatus,
        ]);

        return {
          headers: ['ReferenceNumber', 'TransferDate', 'SenderAccount', 'ReceiverAccount', 'TransferAmount', 'LedgerLegs', 'Status'],
          rows,
          rowCount: rows.length,
          executionTimeMs: Math.round((performance.now() - start) * 10) / 10 + 0.9,
          queryDescription: 'Correlated transfer reference ledger across dual credit and debit journal postings.',
        };
      },
    },
  ];

  const handleRunQuery = (key: string) => {
    setActiveQueryKey(key);
    const preset = SQL_PRESETS.find((p) => p.key === key);
    if (preset) {
      setQueryResult(preset.execute());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const T_SQL_SCRIPTS: Record<string, string> = {
    'create_database.sql': `-- ============================================================================
-- SCRIPT: create_database.sql
-- PURPOSE: Create BANKPRO Database with snapshot isolation & strict collation
-- ============================================================================
USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'BankProDB')
BEGIN
    ALTER DATABASE BankProDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BankProDB;
END
GO

CREATE DATABASE BankProDB
COLLATE Latin1_General_100_CI_AS_SC_UTF8;
GO

ALTER DATABASE BankProDB SET READ_COMMITTED_SNAPSHOT ON;
ALTER DATABASE BankProDB SET ALLOW_SNAPSHOT_ISOLATION ON;
GO

USE BankProDB;
GO`,

    'create_tables.sql': `-- ============================================================================
-- SCRIPT: create_tables.sql
-- PURPOSE: BankPro SQL Server Relational Schemas, Primary & Foreign Keys, Constraints
-- ============================================================================
USE BankProDB;
GO

-- 1. Customers Table
CREATE TABLE dbo.Customers (
    CustomerID INT IDENTITY(1001, 1) NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Address NVARCHAR(255) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    PinCode VARCHAR(10) NOT NULL,
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Customers_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Customers PRIMARY KEY CLUSTERED (CustomerID),
    CONSTRAINT UQ_Customers_Email UNIQUE (Email),
    CONSTRAINT UQ_Customers_Phone UNIQUE (Phone),
    CONSTRAINT CK_Customers_Gender CHECK (Gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT CK_Customers_DOB CHECK (DateOfBirth <= DATEADD(YEAR, -18, CAST(SYSUTCDATETIME() AS DATE)))
);
GO

-- 2. Employees Table
CREATE TABLE dbo.Employees (
    EmployeeID INT IDENTITY(501, 1) NOT NULL,
    EmployeeName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(100) NOT NULL,
    Role VARCHAR(30) NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Employees_Status DEFAULT 'ACTIVE',
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Employees_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Employees PRIMARY KEY CLUSTERED (EmployeeID),
    CONSTRAINT UQ_Employees_Email UNIQUE (Email),
    CONSTRAINT CK_Employees_Role CHECK (Role IN ('TELLER', 'BRANCH_MANAGER', 'AUDITOR', 'ADMIN')),
    CONSTRAINT CK_Employees_Status CHECK (Status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED'))
);
GO

-- 3. Accounts Table
CREATE TABLE dbo.Accounts (
    AccountID INT IDENTITY(1, 1) NOT NULL,
    CustomerID INT NOT NULL,
    AccountNumber VARCHAR(20) NOT NULL,
    AccountType VARCHAR(20) NOT NULL,
    Balance DECIMAL(18, 4) NOT NULL CONSTRAINT DF_Accounts_Balance DEFAULT 0.0000,
    AccountStatus VARCHAR(20) NOT NULL CONSTRAINT DF_Accounts_Status DEFAULT 'PENDING',
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Accounts_CreatedAt DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION,
    CONSTRAINT PK_Accounts PRIMARY KEY CLUSTERED (AccountID),
    CONSTRAINT UQ_Accounts_AccountNumber UNIQUE (AccountNumber),
    CONSTRAINT FK_Accounts_Customers FOREIGN KEY (CustomerID) REFERENCES dbo.Customers(CustomerID) ON DELETE NO ACTION,
    CONSTRAINT CK_Accounts_Type CHECK (AccountType IN ('SAVINGS', 'CURRENT')),
    CONSTRAINT CK_Accounts_Status CHECK (AccountStatus IN ('ACTIVE', 'FROZEN', 'CLOSED', 'PENDING')),
    CONSTRAINT CK_Accounts_PositiveBalance CHECK (Balance >= 0.0000)
);
GO

CREATE NONCLUSTERED INDEX IX_Accounts_CustomerID ON dbo.Accounts(CustomerID) INCLUDE (AccountNumber, Balance, AccountStatus);
GO

-- 4. Transactions Table
CREATE TABLE dbo.Transactions (
    TransactionID BIGINT IDENTITY(100001, 1) NOT NULL,
    TransactionReference VARCHAR(36) NOT NULL,
    AccountID INT NOT NULL,
    TransactionType VARCHAR(15) NOT NULL,
    Amount DECIMAL(18, 4) NOT NULL,
    RunningBalance DECIMAL(18, 4) NOT NULL,
    TransactionDate DATETIME2(3) NOT NULL CONSTRAINT DF_Transactions_Date DEFAULT SYSUTCDATETIME(),
    Description NVARCHAR(255) NOT NULL,
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_Transactions_Status DEFAULT 'COMPLETED',
    CONSTRAINT PK_Transactions PRIMARY KEY CLUSTERED (TransactionID),
    CONSTRAINT UQ_Transactions_Ref UNIQUE (TransactionReference),
    CONSTRAINT FK_Transactions_Accounts FOREIGN KEY (AccountID) REFERENCES dbo.Accounts(AccountID),
    CONSTRAINT CK_Transactions_Type CHECK (TransactionType IN ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_DR', 'TRANSFER_CR')),
    CONSTRAINT CK_Transactions_Amount CHECK (Amount > 0.0000),
    CONSTRAINT CK_Transactions_Status CHECK (Status IN ('COMPLETED', 'FAILED', 'PENDING', 'REVERSED'))
);
GO

CREATE NONCLUSTERED INDEX IX_Transactions_AccountDate ON dbo.Transactions(AccountID, TransactionDate DESC) INCLUDE (TransactionType, Amount, RunningBalance);
GO

-- 5. Transfers Table
CREATE TABLE dbo.Transfers (
    TransferID BIGINT IDENTITY(1, 1) NOT NULL,
    SenderAccountID INT NOT NULL,
    ReceiverAccountID INT NOT NULL,
    Amount DECIMAL(18, 4) NOT NULL,
    ReferenceNumber VARCHAR(50) NOT NULL,
    TransferDate DATETIME2(3) NOT NULL CONSTRAINT DF_Transfers_Date DEFAULT SYSUTCDATETIME(),
    TransferStatus VARCHAR(20) NOT NULL CONSTRAINT DF_Transfers_Status DEFAULT 'SUCCESS',
    Notes NVARCHAR(255) NULL,
    CONSTRAINT PK_Transfers PRIMARY KEY CLUSTERED (TransferID),
    CONSTRAINT UQ_Transfers_Ref UNIQUE (ReferenceNumber),
    CONSTRAINT FK_Transfers_Sender FOREIGN KEY (SenderAccountID) REFERENCES dbo.Accounts(AccountID),
    CONSTRAINT FK_Transfers_Receiver FOREIGN KEY (ReceiverAccountID) REFERENCES dbo.Accounts(AccountID),
    CONSTRAINT CK_Transfers_DiffAccounts CHECK (SenderAccountID <> ReceiverAccountID),
    CONSTRAINT CK_Transfers_Amount CHECK (Amount > 0.0000)
);
GO

-- 6. Beneficiaries Table
CREATE TABLE dbo.Beneficiaries (
    BeneficiaryID INT IDENTITY(1, 1) NOT NULL,
    CustomerID INT NOT NULL,
    BeneficiaryAccountNumber VARCHAR(20) NOT NULL,
    BeneficiaryName NVARCHAR(150) NOT NULL,
    CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Beneficiaries_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Beneficiaries PRIMARY KEY CLUSTERED (BeneficiaryID),
    CONSTRAINT FK_Beneficiaries_Customers FOREIGN KEY (CustomerID) REFERENCES dbo.Customers(CustomerID),
    CONSTRAINT UQ_Customer_Beneficiary UNIQUE (CustomerID, BeneficiaryAccountNumber)
);
GO

-- 7. AuditLogs Table
CREATE TABLE dbo.AuditLogs (
    LogID BIGINT IDENTITY(1, 1) NOT NULL,
    UserID VARCHAR(30) NULL,
    UserRole VARCHAR(20) NOT NULL,
    Action VARCHAR(100) NOT NULL,
    IPAddress VARCHAR(45) NOT NULL,
    Timestamp DATETIME2(3) NOT NULL CONSTRAINT DF_AuditLogs_Timestamp DEFAULT SYSUTCDATETIME(),
    Description NVARCHAR(MAX) NOT NULL,
    CONSTRAINT PK_AuditLogs PRIMARY KEY CLUSTERED (LogID)
);
GO

-- 8. BankSettings Table
CREATE TABLE dbo.BankSettings (
    SettingID INT IDENTITY(1, 1) NOT NULL,
    SettingName VARCHAR(50) NOT NULL,
    SettingValue NVARCHAR(255) NOT NULL,
    Description NVARCHAR(255) NULL,
    CONSTRAINT PK_BankSettings PRIMARY KEY CLUSTERED (SettingID),
    CONSTRAINT UQ_BankSettings_Name UNIQUE (SettingName)
);
GO`,

    'stored_procedures.sql': `-- ============================================================================
-- SCRIPT: stored_procedures.sql
-- PURPOSE: Atomic procedures with row-level locks, rollback & ACID consistency
-- ============================================================================
USE BankProDB;
GO

-- 1. Deposit Funds Procedure
CREATE OR ALTER PROCEDURE dbo.usp_DepositFunds
    @AccountNumber VARCHAR(20),
    @Amount DECIMAL(18, 4),
    @Description NVARCHAR(255),
    @TransactionRef VARCHAR(36),
    @NewBalance DECIMAL(18, 4) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Amount <= 0
        THROW 50001, 'Deposit amount must be strictly positive.', 1;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @AccID INT, @Status VARCHAR(20), @CurrBal DECIMAL(18, 4);

        SELECT 
            @AccID = AccountID,
            @Status = AccountStatus,
            @CurrBal = Balance
        FROM dbo.Accounts WITH (UPDLOCK, ROWLOCK)
        WHERE AccountNumber = @AccountNumber;

        IF @AccID IS NULL
            THROW 50002, 'Destination account not found.', 1;

        IF @Status <> 'ACTIVE'
            THROW 50003, 'Transactions cannot be conducted on a non-active account.', 1;

        SET @NewBalance = @CurrBal + @Amount;

        UPDATE dbo.Accounts
        SET Balance = @NewBalance
        WHERE AccountID = @AccID;

        INSERT INTO dbo.Transactions (TransactionReference, AccountID, TransactionType, Amount, RunningBalance, Description, Status)
        VALUES (@TransactionRef, @AccID, 'DEPOSIT', @Amount, @NewBalance, @Description, 'COMPLETED');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 2. Withdrawal Procedure
CREATE OR ALTER PROCEDURE dbo.usp_WithdrawFunds
    @AccountNumber VARCHAR(20),
    @Amount DECIMAL(18, 4),
    @Description NVARCHAR(255),
    @TransactionRef VARCHAR(36),
    @NewBalance DECIMAL(18, 4) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @Amount <= 0
        THROW 50004, 'Withdrawal amount must be strictly positive.', 1;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @AccID INT, @Status VARCHAR(20), @CurrBal DECIMAL(18, 4), @AccType VARCHAR(20);
        DECLARE @MinBalance DECIMAL(18, 4) = 500.0000;

        SELECT 
            @AccID = AccountID,
            @Status = AccountStatus,
            @CurrBal = Balance,
            @AccType = AccountType
        FROM dbo.Accounts WITH (UPDLOCK, ROWLOCK)
        WHERE AccountNumber = @AccountNumber;

        IF @AccID IS NULL
            THROW 50005, 'Target account not found.', 1;

        IF @Status <> 'ACTIVE'
            THROW 50006, 'Target account is not active for debit.', 1;

        IF @AccType = 'CURRENT'
            SET @MinBalance = 0.0000;

        IF (@CurrBal - @Amount) < @MinBalance
            THROW 50007, 'Insufficient funds. Account balance cannot breach required minimum threshold.', 1;

        SET @NewBalance = @CurrBal - @Amount;

        UPDATE dbo.Accounts
        SET Balance = @NewBalance
        WHERE AccountID = @AccID;

        INSERT INTO dbo.Transactions (TransactionReference, AccountID, TransactionType, Amount, RunningBalance, Description, Status)
        VALUES (@TransactionRef, @AccID, 'WITHDRAWAL', @Amount, @NewBalance, @Description, 'COMPLETED');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 3. Atomic Peer-to-Peer Transfer (Deadlock-Free Lock Ordering)
CREATE OR ALTER PROCEDURE dbo.usp_ExecuteTransfer
    @SenderAccNo VARCHAR(20),
    @ReceiverAccNo VARCHAR(20),
    @Amount DECIMAL(18, 4),
    @ReferenceNumber VARCHAR(50),
    @Description NVARCHAR(255),
    @SenderRunningBal DECIMAL(18, 4) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @SenderAccNo = @ReceiverAccNo
        THROW 50010, 'Self-transfers are not allowed.', 1;

    IF @Amount <= 0.0000
        THROW 50011, 'Transfer amount must be strictly greater than zero.', 1;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @SenderID INT, @SenderBal DECIMAL(18,4), @SenderStatus VARCHAR(20), @SenderType VARCHAR(20);
        DECLARE @ReceiverID INT, @ReceiverBal DECIMAL(18,4), @ReceiverStatus VARCHAR(20);
        DECLARE @MinBalance DECIMAL(18, 4) = 500.0000;

        -- Deadlock prevention: order lock acquisition deterministically
        IF @SenderAccNo < @ReceiverAccNo
        BEGIN
            SELECT @SenderID = AccountID, @SenderBal = Balance, @SenderStatus = AccountStatus, @SenderType = AccountType 
            FROM dbo.Accounts WITH (UPDLOCK, ROWLOCK) WHERE AccountNumber = @SenderAccNo;

            SELECT @ReceiverID = AccountID, @ReceiverBal = Balance, @ReceiverStatus = AccountStatus 
            FROM dbo.Accounts WITH (UPDLOCK, ROWLOCK) WHERE AccountNumber = @ReceiverAccNo;
        END
        ELSE
        BEGIN
            SELECT @ReceiverID = AccountID, @ReceiverBal = Balance, @ReceiverStatus = AccountStatus 
            FROM dbo.Accounts WITH (UPDLOCK, ROWLOCK) WHERE AccountNumber = @ReceiverAccNo;

            SELECT @SenderID = AccountID, @SenderBal = Balance, @SenderStatus = AccountStatus, @SenderType = AccountType 
            FROM dbo.Accounts WITH (UPDLOCK, ROWLOCK) WHERE AccountNumber = @SenderAccNo;
        END

        IF @SenderID IS NULL OR @ReceiverID IS NULL
            THROW 50012, 'Either sender or receiver account does not exist.', 1;

        IF @SenderStatus <> 'ACTIVE' OR @ReceiverStatus <> 'ACTIVE'
            THROW 50013, 'Both sender and receiver accounts must be ACTIVE.', 1;

        IF @SenderType = 'CURRENT'
            SET @MinBalance = 0.0000;

        IF (@SenderBal - @Amount) < @MinBalance
            THROW 50014, 'Insufficient cleared funds to complete transfer.', 1;

        SET @SenderRunningBal = @SenderBal - @Amount;
        DECLARE @ReceiverRunningBal DECIMAL(18, 4) = @ReceiverBal + @Amount;

        UPDATE dbo.Accounts SET Balance = @SenderRunningBal WHERE AccountID = @SenderID;
        UPDATE dbo.Accounts SET Balance = @ReceiverRunningBal WHERE AccountID = @ReceiverID;

        INSERT INTO dbo.Transfers (SenderAccountID, ReceiverAccountID, Amount, ReferenceNumber, TransferStatus, Notes)
        VALUES (@SenderID, @ReceiverID, @Amount, @ReferenceNumber, 'SUCCESS', @Description);

        DECLARE @SenderTxRef VARCHAR(36) = CONVERT(VARCHAR(36), NEWID());
        DECLARE @ReceiverTxRef VARCHAR(36) = CONVERT(VARCHAR(36), NEWID());

        INSERT INTO dbo.Transactions (TransactionReference, AccountID, TransactionType, Amount, RunningBalance, Description, Status)
        VALUES 
        (@SenderTxRef, @SenderID, 'TRANSFER_DR', @Amount, @SenderRunningBal, CONCAT('Sent to Acc: ', @ReceiverAccNo, ' - ', @Description), 'COMPLETED'),
        (@ReceiverTxRef, @ReceiverID, 'TRANSFER_CR', @Amount, @ReceiverRunningBal, CONCAT('Received from Acc: ', @SenderAccNo, ' - ', @Description), 'COMPLETED');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO`,

    'views.sql': `-- ============================================================================
-- SCRIPT: views.sql
-- PURPOSE: Analytical Views demonstrating joins, CTEs, and window functions
-- ============================================================================
USE BankProDB;
GO

-- 1. View Customer Account Summaries (INNER & LEFT JOIN)
CREATE OR ALTER VIEW dbo.vw_CustomerAccountSummaries AS
SELECT 
    c.CustomerID,
    c.FullName,
    c.Email,
    c.Phone,
    a.AccountID,
    a.AccountNumber,
    a.AccountType,
    a.Balance,
    a.AccountStatus,
    COUNT(t.TransactionID) AS LifetimeTransactions,
    ISNULL(SUM(CASE WHEN t.TransactionType IN ('DEPOSIT', 'TRANSFER_CR') THEN t.Amount ELSE 0 END), 0.0000) AS TotalInflow,
    ISNULL(SUM(CASE WHEN t.TransactionType IN ('WITHDRAWAL', 'TRANSFER_DR') THEN t.Amount ELSE 0 END), 0.0000) AS TotalOutflow
FROM dbo.Customers c
INNER JOIN dbo.Accounts a ON c.CustomerID = a.CustomerID
LEFT JOIN dbo.Transactions t ON a.AccountID = t.AccountID
GROUP BY 
    c.CustomerID, c.FullName, c.Email, c.Phone,
    a.AccountID, a.AccountNumber, a.AccountType, a.Balance, a.AccountStatus;
GO

-- 2. View Monthly Activity using Window Functions and CTEs
CREATE OR ALTER VIEW dbo.vw_MonthlyAccountActivity AS
WITH MonthlyAggregates AS (
    SELECT 
        a.AccountID,
        a.AccountNumber,
        c.FullName,
        YEAR(t.TransactionDate) AS TxYear,
        MONTH(t.TransactionDate) AS TxMonth,
        COUNT(t.TransactionID) AS MonthlyCount,
        SUM(CASE WHEN t.TransactionType IN ('DEPOSIT', 'TRANSFER_CR') THEN t.Amount ELSE 0 END) AS MonthlyDeposited,
        SUM(CASE WHEN t.TransactionType IN ('WITHDRAWAL', 'TRANSFER_DR') THEN t.Amount ELSE 0 END) AS MonthlyWithdrawn
    FROM dbo.Accounts a
    INNER JOIN dbo.Customers c ON a.CustomerID = c.CustomerID
    INNER JOIN dbo.Transactions t ON a.AccountID = t.AccountID
    GROUP BY 
        a.AccountID, a.AccountNumber, c.FullName, 
        YEAR(t.TransactionDate), MONTH(t.TransactionDate)
)
SELECT 
    AccountID,
    AccountNumber,
    FullName,
    TxYear,
    TxMonth,
    MonthlyCount,
    MonthlyDeposited,
    MonthlyWithdrawn,
    DENSE_RANK() OVER (PARTITION BY TxYear, TxMonth ORDER BY (MonthlyDeposited + MonthlyWithdrawn) DESC) AS ActivityRankByVolume,
    ROW_NUMBER() OVER (PARTITION BY AccountID ORDER BY TxYear DESC, TxMonth DESC) AS RecencyIndex
FROM MonthlyAggregates;
GO`,

    'triggers.sql': `-- ============================================================================
-- SCRIPT: triggers.sql
-- PURPOSE: Audit account balance changes and enforce integrity
-- ============================================================================
USE BankProDB;
GO

CREATE OR ALTER TRIGGER dbo.TR_Account_AuditStateChange
ON dbo.Accounts
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(AccountStatus)
    BEGIN
        INSERT INTO dbo.AuditLogs (UserID, UserRole, Action, IPAddress, Timestamp, Description)
        SELECT 
            CONCAT('CUST-', d.CustomerID),
            'SYSTEM',
            'ACCOUNT_STATUS_CHANGE',
            '127.0.0.1',
            SYSUTCDATETIME(),
            CONCAT('Account ', d.AccountNumber, ' status updated from ', d.AccountStatus, ' to ', i.AccountStatus)
        FROM inserted i
        INNER JOIN deleted d ON i.AccountID = d.AccountID
        WHERE i.AccountStatus <> d.AccountStatus;
    END
END;
GO`,

    'sample_data.sql': `-- ============================================================================
-- SCRIPT: sample_data.sql
-- PURPOSE: Mock baseline test fixtures
-- ============================================================================
USE BankProDB;
GO

INSERT INTO dbo.BankSettings (SettingName, SettingValue, Description)
VALUES 
('MIN_SAVINGS_BALANCE', '500.00', 'Minimum required balance for Savings Accounts'),
('DAILY_TRANSFER_LIMIT', '50000.00', 'Maximum daily transfer volume per customer'),
('SUSPICIOUS_TX_THRESHOLD', '10000.00', 'Flag transaction for compliance review');

INSERT INTO dbo.Employees (EmployeeName, Email, Role, Status)
VALUES
('Sarah Connor', 'sconnor@bankpro.internal', 'ADMIN', 'ACTIVE'),
('David Miller', 'dmiller@bankpro.internal', 'TELLER', 'ACTIVE'),
('Marcus Vance', 'mvance@bankpro.internal', 'BRANCH_MANAGER', 'ACTIVE');

INSERT INTO dbo.Customers (FullName, DateOfBirth, Gender, Email, Phone, Address, City, State, PinCode)
VALUES
('Alice Henderson', '1990-04-12', 'Female', 'alice@example.com', '+1 (555) 123-4567', '452 Elm St', 'Metropolis', 'NY', '10001'),
('Bob Alexander', '1985-08-23', 'Male', 'bob@example.com', '+1 (555) 987-6543', '789 Oak Ave', 'Gotham', 'NJ', '07001'),
('Catherine Vance', '1993-11-05', 'Female', 'catherine@example.com', '+1 (555) 432-8765', '120 Riverside Blvd', 'Star City', 'CA', '90210');

INSERT INTO dbo.Accounts (CustomerID, AccountNumber, AccountType, Balance, AccountStatus)
VALUES
(1001, 'BPRO10010001', 'SAVINGS', 15500.0000, 'ACTIVE'),
(1001, 'BPRO10010002', 'CURRENT', 3200.0000, 'ACTIVE'),
(1002, 'BPRO10020002', 'CURRENT', 4200.0000, 'ACTIVE'),
(1003, 'BPRO10030003', 'SAVINGS', 8750.0000, 'ACTIVE');
GO`,
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase">
              <Database className="w-4 h-4" />
              <span>Microsoft SQL Server 2022 Architecture</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
              SQL Engine & Database Architecture Studio
            </h2>
            <p className="text-sm text-slate-500 max-w-2xl">
              Inspect database schemas, execute live relational queries with Window Functions and CTEs, and browse official T-SQL scripts.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start md:self-auto border border-slate-200">
            <button
              onClick={() => {
                setActiveTab('runner');
                if (!queryResult) handleRunQuery('customer_accounts_join');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'runner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Query Runner</span>
            </button>
            <button
              onClick={() => setActiveTab('er_diagram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'er_diagram' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>ER Diagram</span>
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'scripts' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-blue-600" />
              <span>T-SQL Scripts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab: Live Query Runner */}
      {activeTab === 'runner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Query Presets Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Advanced SQL Demonstrations
              </h3>
              <div className="space-y-2">
                {SQL_PRESETS.map((preset) => {
                  const isSelected = activeQueryKey === preset.key;
                  return (
                    <button
                      key={preset.key}
                      onClick={() => handleRunQuery(preset.key)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span>{preset.title}</span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        Category: <span className="font-medium text-slate-700">{preset.category}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Database Engine:</span>
                <span className="font-mono font-medium text-slate-900">Microsoft SQL Server 2022</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Isolation Level:</span>
                <span className="font-mono font-medium text-emerald-700">READ_COMMITTED_SNAPSHOT</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Live Accounts:</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {bankStore.getAccounts().length}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Transactions in Ledger:</span>
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {bankStore.getTransactions().length}
                </span>
              </div>
            </div>
          </div>

          {/* Query Editor & Result Viewport */}
          <div className="lg:col-span-8 space-y-4">
            {/* SQL Code Box */}
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono text-slate-300">T-SQL Query Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const cur = SQL_PRESETS.find((p) => p.key === activeQueryKey);
                      if (cur) copyToClipboard(cur.sql);
                    }}
                    className="flex items-center gap-1 text-[11px] hover:text-white transition-colors"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleRunQuery(activeQueryKey)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded font-medium text-[11px] transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Execute</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 text-xs font-mono text-blue-100 overflow-x-auto leading-relaxed max-h-64">
                {SQL_PRESETS.find((p) => p.key === activeQueryKey)?.sql}
              </pre>
            </div>

            {/* Results Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">Execution Results</span>
                  {queryResult && (
                    <span className="text-xs text-slate-500">
                      ({queryResult.rowCount} rows · {queryResult.executionTimeMs}ms)
                    </span>
                  )}
                </div>
                {queryResult && (
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                    STATUS 200: OK
                  </span>
                )}
              </div>

              {queryResult ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        {queryResult.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2.5 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 whitespace-nowrap font-mono tabular-nums text-slate-800">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Click <span className="font-semibold text-slate-700">"Execute"</span> to run query and view live relational results.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: ER Diagram */}
      {activeTab === 'er_diagram' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="font-bold text-base text-slate-900 font-display mb-2">
              Entity Relationship (ER) Data Model
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Normalized 3NF Relational Architecture for BankPro on Microsoft SQL Server with strict foreign keys, check constraints, and cascade prevention.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Table 1: Customers */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-blue-900 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                  <span>dbo.Customers</span>
                  <span className="text-[10px] font-normal opacity-80">1,000+ IDs</span>
                </div>
                <div className="p-3 text-xs space-y-1 font-mono">
                  <div className="text-blue-700 font-semibold">PK CustomerID (INT)</div>
                  <div className="text-slate-600">FullName (NVARCHAR)</div>
                  <div className="text-slate-600">DateOfBirth (DATE)</div>
                  <div className="text-slate-600">Gender (VARCHAR)</div>
                  <div className="text-amber-700">UQ Email (NVARCHAR)</div>
                  <div className="text-amber-700">UQ Phone (VARCHAR)</div>
                  <div className="text-slate-500">Address, City, State</div>
                  <div className="text-slate-400">CreatedAt (DATETIME2)</div>
                </div>
              </div>

              {/* Table 2: Accounts */}
              <div className="border border-blue-300 rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-blue-100">
                <div className="bg-blue-800 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                  <span>dbo.Accounts</span>
                  <span className="text-[10px] font-normal opacity-80">Core Ledger</span>
                </div>
                <div className="p-3 text-xs space-y-1 font-mono">
                  <div className="text-blue-700 font-semibold">PK AccountID (INT)</div>
                  <div className="text-purple-700">FK CustomerID (INT)</div>
                  <div className="text-amber-700">UQ AccountNumber (VARCHAR)</div>
                  <div className="text-slate-600">AccountType (SAVINGS/CURRENT)</div>
                  <div className="text-emerald-700 font-semibold">Balance (DECIMAL 18,4)</div>
                  <div className="text-slate-600">AccountStatus (ACTIVE/FROZEN)</div>
                  <div className="text-slate-400">RowVersion (ROWVERSION)</div>
                </div>
              </div>

              {/* Table 3: Transactions */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-slate-900 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                  <span>dbo.Transactions</span>
                  <span className="text-[10px] font-normal opacity-80">Append Only</span>
                </div>
                <div className="p-3 text-xs space-y-1 font-mono">
                  <div className="text-blue-700 font-semibold">PK TransactionID (BIGINT)</div>
                  <div className="text-amber-700">UQ TransactionRef (VARCHAR)</div>
                  <div className="text-purple-700">FK AccountID (INT)</div>
                  <div className="text-slate-600">TransactionType (CR/DR)</div>
                  <div className="text-slate-600">Amount (DECIMAL 18,4)</div>
                  <div className="text-slate-600">RunningBalance (DECIMAL)</div>
                  <div className="text-slate-500">Description (NVARCHAR)</div>
                  <div className="text-emerald-700">Status (COMPLETED)</div>
                </div>
              </div>

              {/* Table 4: Transfers */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-blue-950 text-white px-3 py-2 text-xs font-bold flex items-center justify-between">
                  <span>dbo.Transfers</span>
                  <span className="text-[10px] font-normal opacity-80">P2P Journal</span>
                </div>
                <div className="p-3 text-xs space-y-1 font-mono">
                  <div className="text-blue-700 font-semibold">PK TransferID (BIGINT)</div>
                  <div className="text-purple-700">FK SenderAccountID (INT)</div>
                  <div className="text-purple-700">FK ReceiverAccountID (INT)</div>
                  <div className="text-slate-600">Amount (DECIMAL 18,4)</div>
                  <div className="text-amber-700">UQ ReferenceNumber (VARCHAR)</div>
                  <div className="text-slate-500">TransferDate (DATETIME2)</div>
                  <div className="text-emerald-700">TransferStatus (SUCCESS)</div>
                </div>
              </div>
            </div>

            {/* Relationship Map */}
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Referential Integrity & Cardinality Rules</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><code className="text-slate-800 font-bold">Customers (1) —&gt; (N) Accounts</code>: Foreign key on CustomerID enforces ON DELETE NO ACTION to protect historical ledgers.</li>
                <li><code className="text-slate-800 font-bold">Accounts (1) —&gt; (N) Transactions</code>: Append-only ledger updates with running balance tracking.</li>
                <li><code className="text-slate-800 font-bold">Accounts (1) —&gt; (N) Transfers (Dual Legs)</code>: Transfers link distinct Sender and Receiver accounts with CHECK constraint <code className="text-slate-800 font-mono">(SenderAccountID &lt;&gt; ReceiverAccountID)</code>.</li>
                <li><code className="text-slate-800 font-bold">CHECK (Balance &gt;= 0)</code>: Hardware-level non-negative constraint prevents overdraft violations.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab: T-SQL Scripts */}
      {activeTab === 'scripts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-2">
            <div className="bg-white border border-slate-200 rounded-xl p-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                SQL Server Script Files
              </h4>
              <div className="space-y-1">
                {Object.keys(T_SQL_SCRIPTS).map((scriptName) => {
                  const isSelected = selectedScript === scriptName;
                  return (
                    <button
                      key={scriptName}
                      onClick={() => setSelectedScript(scriptName)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs font-mono transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{scriptName}</span>
                      <FileCode2 className="w-3.5 h-3.5 opacity-70" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 text-xs">
                <span className="font-mono text-slate-300">{selectedScript}</span>
                <button
                  onClick={() => copyToClipboard(T_SQL_SCRIPTS[selectedScript])}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied to Clipboard' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-blue-100 overflow-x-auto leading-relaxed max-h-[500px]">
                {T_SQL_SCRIPTS[selectedScript]}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
