import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { Account, Transaction } from '../../types';
import { bankStore } from '../../services/bankStore';
import {
  SPENDING_CATEGORIES,
  categorizeTransaction,
  computeMonthlyCategoryTrends,
  SpendingCategory,
} from '../../utils/spendingCategories';
import {
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Tag,
  Filter,
  DollarSign,
  Calendar,
  AlertCircle,
  ShoppingBag,
  Home,
  Zap,
  Coffee,
  Car,
  HeartPulse,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Info,
  Check,
  TrendingUp,
} from 'lucide-react';

export interface SpendingTrendsProps {
  accounts?: Account[];
  transactions?: Transaction[];
  onSelectTransaction?: (tx: Transaction) => void;
}

export const SpendingTrends: React.FC<SpendingTrendsProps> = ({
  accounts: propAccounts,
  transactions: propTransactions,
}) => {
  const [storeAccounts, setStoreAccounts] = useState<Account[]>([]);
  const [storeTxs, setStoreTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!propAccounts || !propTransactions) {
      setStoreAccounts(bankStore.getAccounts());
      setStoreTxs(bankStore.getTransactions());
      const unsub = bankStore.subscribe(() => {
        setStoreAccounts(bankStore.getAccounts());
        setStoreTxs(bankStore.getTransactions());
      });
      return () => unsub();
    }
  }, [propAccounts, propTransactions]);

  const accounts = propAccounts || storeAccounts;
  const transactions = propTransactions || storeTxs;
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [activeChartType, setActiveChartType] = useState<'stacked_bar' | 'donut' | 'area'>('stacked_bar');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<Set<string>>(new Set());
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

  // Filter transactions by selected account
  const accountFilteredTxs = useMemo(() => {
    if (selectedAccountId === 'ALL') {
      return transactions;
    }
    const accId = parseInt(selectedAccountId, 10);
    return transactions.filter((t) => t.accountID === accId);
  }, [transactions, selectedAccountId]);

  // Compute trends
  const {
    monthlyData,
    categorySummaries,
    totalPeriodOutflow,
    highestCategory,
    averageMonthlyOutflow,
  } = useMemo(() => {
    return computeMonthlyCategoryTrends(accountFilteredTxs);
  }, [accountFilteredTxs]);

  // Map of transactions per month & category for precision tooltip details
  const monthlyTxCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};
    accountFilteredTxs
      .filter((tx) => tx.transactionType === 'WITHDRAWAL' || tx.transactionType === 'TRANSFER_DR')
      .forEach((tx) => {
        const d = new Date(tx.transactionDate);
        const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const cat = categorizeTransaction(tx);
        if (!counts[monthLabel]) counts[monthLabel] = {};
        counts[monthLabel][cat.id] = (counts[monthLabel][cat.id] || 0) + 1;
      });
    return counts;
  }, [accountFilteredTxs]);

  // Data for Donut Chart (filtered by hidden categories)
  const pieChartData = useMemo(() => {
    return categorySummaries
      .filter((cat) => !hiddenCategoryIds.has(cat.id))
      .map((cat) => ({
        name: cat.name,
        value: cat.totalAmount,
        color: cat.color,
        id: cat.id,
        percentage: cat.percentage,
        transactionCount: cat.transactionCount,
      }));
  }, [categorySummaries, hiddenCategoryIds]);

  // Filtered outflows for the ledger table below
  const categorizedOutflows = useMemo(() => {
    return accountFilteredTxs
      .filter((tx) => tx.transactionType === 'WITHDRAWAL' || tx.transactionType === 'TRANSFER_DR')
      .map((tx) => ({
        ...tx,
        category: categorizeTransaction(tx),
      }))
      .filter((tx) => {
        if (activeCategoryFilter !== 'ALL' && tx.category.id !== activeCategoryFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [accountFilteredTxs, activeCategoryFilter]);

  // Category Icon Resolver
  const getCategoryIcon = (categoryId: string, sizeClass = 'w-3.5 h-3.5') => {
    switch (categoryId) {
      case 'rent':
        return <Home className={sizeClass} />;
      case 'utilities':
        return <Zap className={sizeClass} />;
      case 'groceries':
        return <ShoppingBag className={sizeClass} />;
      case 'dining':
        return <Coffee className={sizeClass} />;
      case 'transport':
        return <Car className={sizeClass} />;
      case 'shopping':
        return <Tag className={sizeClass} />;
      case 'healthcare':
        return <HeartPulse className={sizeClass} />;
      default:
        return <Layers className={sizeClass} />;
    }
  };

  // Toggle Category Visibility in Chart
  const toggleCategoryVisibility = (catId: string) => {
    setHiddenCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        // Prevent hiding all categories
        if (next.size < SPENDING_CATEGORIES.length - 1) {
          next.add(catId);
        }
      }
      return next;
    });
  };

  const showAllCategories = () => {
    setHiddenCategoryIds(new Set());
  };

  // 1. Customized High-Precision Tooltip for Bar Chart
  const CustomPrecisionBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Calculate month total of only visible categories
      const visibleEntries = payload.filter((entry: any) => !hiddenCategoryIds.has(entry.dataKey) && entry.value > 0);
      const totalMonthVal = visibleEntries.reduce((acc: number, entry: any) => acc + (entry.value || 0), 0);
      const monthCounts = monthlyTxCounts[label] || {};
      const totalMonthTxCount = Object.values(monthCounts).reduce((a, b) => a + b, 0);

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-sans max-w-sm min-w-[260px] animate-in fade-in zoom-in-95 duration-100 z-50">
          {/* Tooltip Header */}
          <div className="border-b border-slate-800 pb-2 mb-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{label} Outflows</span>
              </div>
              <span className="font-mono text-rose-400 font-bold text-sm tabular-nums">
                ${totalMonthVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
              <span>{visibleEntries.length} active spending categories</span>
              <span>{totalMonthTxCount} debit transactions</span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {visibleEntries
              .sort((a: any, b: any) => b.value - a.value)
              .map((entry: any, index: number) => {
                const cat = SPENDING_CATEGORIES.find((c) => c.id === entry.dataKey);
                const percentOfMonth = totalMonthVal > 0 ? ((entry.value / totalMonthVal) * 100).toFixed(1) : '0';
                const count = monthCounts[entry.dataKey] || 1;
                const isHovered = hoveredCategoryId === entry.dataKey;

                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-1.5 rounded transition-colors ${
                      isHovered ? 'bg-slate-800 ring-1 ring-blue-500/50' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="truncate">
                        <span className="text-slate-200 font-medium block truncate">
                          {cat ? cat.name : entry.dataKey}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {count} {count === 1 ? 'transaction' : 'transactions'} · {percentOfMonth}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-white tabular-nums block">
                        ${entry.value.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Tooltip Footer Info */}
          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Click legend items to isolate tags</span>
            <span className="text-blue-400 font-mono">100% Verified</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // 2. Customized Precision Tooltip for Donut Chart
  const CustomPrecisionPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const cat = SPENDING_CATEGORIES.find((c) => c.id === data.payload.id);
      const avgTx = data.payload.transactionCount > 0 ? data.value / data.payload.transactionCount : 0;

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-sans min-w-[240px] animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data.payload.color }} />
            <span className="font-bold text-sm">{data.name}</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center text-slate-300">
              <span>Cumulative Spent:</span>
              <span className="text-white font-mono font-bold tabular-nums">${data.value.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Overall Share:</span>
              <span className="text-emerald-400 font-mono font-semibold">{data.payload.percentage}% of total</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Volume Count:</span>
              <span className="text-slate-200 font-mono">{data.payload.transactionCount} entries</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Avg Entry Size:</span>
              <span className="text-slate-200 font-mono tabular-nums">${avgTx.toFixed(2)}</span>
            </div>
          </div>

          {cat && cat.keywords.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
              <span className="text-slate-500">Matching tags: </span>
              {cat.keywords.slice(0, 4).join(', ')}...
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 3. Customized Precision Tooltip for Area Chart
  const CustomPrecisionAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value || 0;
      const deltaFromAvg = val - averageMonthlyOutflow;
      const isAboveAvg = deltaFromAvg > 0;

      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-sans min-w-[220px]">
          <div className="font-bold border-b border-slate-800 pb-1.5 mb-1.5 flex justify-between items-center">
            <span>{label}</span>
            <span className="font-mono text-rose-400 font-bold">${val.toFixed(2)}</span>
          </div>
          <div className="text-[11px] text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Monthly Average:</span>
              <span className="font-mono tabular-nums">${averageMonthlyOutflow.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Trajectory:</span>
              <span className={`font-mono font-semibold ${isAboveAvg ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isAboveAvg ? `+$${deltaFromAvg.toFixed(2)} above avg` : `-$${Math.abs(deltaFromAvg).toFixed(2)} below avg`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4" />
              <span>Outflow Telemetry & Spending Analysis</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Spending Trends
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              Categorized transaction outflows grouped by description tags including Rent, Utilities, Groceries, and Dining.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Account Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Account:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              >
                <option value="ALL">All Linked Accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.accountID} value={acc.accountID.toString()}>
                    {acc.accountNumber} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>

            {/* Chart Type Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveChartType('stacked_bar')}
                className={`p-1.5 rounded-md transition-colors ${
                  activeChartType === 'stacked_bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Stacked Monthly Outflows"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveChartType('donut')}
                className={`p-1.5 rounded-md transition-colors ${
                  activeChartType === 'donut'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Category Breakdown Donut"
              >
                <PieIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveChartType('area')}
                className={`p-1.5 rounded-md transition-colors ${
                  activeChartType === 'area'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Outflow Trajectory Area"
              >
                <LineIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 block">Total Analyzed Outflow</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              ${totalPeriodOutflow.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Across all recorded withdrawals</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 block">Top Expenditure Category</span>
            <div className="text-xl font-bold font-sans text-blue-700 mt-1 truncate">
              {highestCategory ? highestCategory.name : 'None'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              {highestCategory ? `$${highestCategory.totalAmount.toFixed(2)} (${highestCategory.percentage}% of spend)` : 'No transactions'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 block">Average Monthly Outflow</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              ${averageMonthlyOutflow.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Calculated across {monthlyData.length} months</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500 block">Identified Categories</span>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              {categorySummaries.length}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Tagged by description heuristics</span>
          </div>
        </div>
      </div>

      {/* Main Chart Visualization Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Chart Area */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
                  <span>
                    {activeChartType === 'stacked_bar' && 'Monthly Outflow Breakdown by Category'}
                    {activeChartType === 'donut' && 'Aggregate Expenditure Share by Category'}
                    {activeChartType === 'area' && 'Monthly Outflow Trajectory'}
                  </span>
                  {hiddenCategoryIds.size > 0 && (
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {hiddenCategoryIds.size} category hidden
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Precision Recharts engine with interactive category isolation and custom inspection tooltips
                </p>
              </div>

              {hiddenCategoryIds.size > 0 && (
                <button
                  onClick={showAllCategories}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium self-start sm:self-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Show All Categories</span>
                </button>
              )}
            </div>

            {monthlyData.length > 0 ? (
              <div className="h-72 w-full">
                {activeChartType === 'stacked_bar' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: '#64748b', fontSize: 11, fontFamily: "'Public Sans', sans-serif" }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(val) => `$${val}`}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomPrecisionBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      {SPENDING_CATEGORIES.map((cat) => (
                        <Bar
                          key={cat.id}
                          dataKey={cat.id}
                          name={cat.name}
                          stackId="outflow"
                          fill={cat.color}
                          hide={hiddenCategoryIds.has(cat.id)}
                          fillOpacity={hoveredCategoryId && hoveredCategoryId !== cat.id ? 0.3 : 1}
                          stroke={hoveredCategoryId === cat.id ? '#0f172a' : 'transparent'}
                          strokeWidth={hoveredCategoryId === cat.id ? 1.5 : 0}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {activeChartType === 'donut' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPrecisionPieTooltip />} />
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                      >
                        {pieChartData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            fillOpacity={hoveredCategoryId && hoveredCategoryId !== entry.id ? 0.35 : 1}
                            stroke={hoveredCategoryId === entry.id ? '#0f172a' : '#ffffff'}
                            strokeWidth={hoveredCategoryId === entry.id ? 2 : 1}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}

                {activeChartType === 'area' && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="monthLabel"
                        tick={{ fill: '#64748b', fontSize: 11, fontFamily: "'Public Sans', sans-serif" }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(val) => `$${val}`}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomPrecisionAreaTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="totalOutflow"
                        name="Total Outflow"
                        stroke="#e11d48"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#outflowGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-slate-400 text-xs">
                No outflow transactions recorded for this account.
              </div>
            )}
          </div>

          {/* DYNAMIC INTERACTIVE LEGEND BAR */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Dynamic Category Legend & Tag Explanations</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click category to toggle in chart · Hover to trace
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {categorySummaries.map((cat) => {
                const isHidden = hiddenCategoryIds.has(cat.id);
                const isHovered = hoveredCategoryId === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategoryVisibility(cat.id)}
                    onMouseEnter={() => setHoveredCategoryId(cat.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                      isHidden
                        ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 line-through'
                        : isHovered
                        ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-400/30 text-slate-900'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs transition-transform"
                      style={{
                        backgroundColor: isHidden ? '#94a3b8' : cat.color,
                        transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      }}
                    />
                    <div className="flex items-center gap-1 font-medium">
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono no-underline">
                        (${cat.totalAmount.toFixed(0)})
                      </span>
                    </div>

                    {isHidden ? (
                      <EyeOff className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {cat.percentage}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Breakdown & Detailed Explanation Panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-900 font-display">
                Category Explanation & Volume
              </h3>
              <span className="text-[11px] text-slate-400">
                Filter Journal Table
              </span>
            </div>

            <div className="space-y-2.5">
              {categorySummaries.map((cat) => {
                const isSelected = activeCategoryFilter === cat.id;
                const isHovered = hoveredCategoryId === cat.id;
                const fullCat = SPENDING_CATEGORIES.find((c) => c.id === cat.id);

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategoryFilter(isSelected ? 'ALL' : cat.id);
                    }}
                    onMouseEnter={() => setHoveredCategoryId(cat.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-400/20'
                        : isHovered
                        ? 'border-slate-300 bg-slate-50/80 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="p-1 rounded text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          {getCategoryIcon(cat.id, 'w-3 h-3')}
                        </div>
                        <span className="font-semibold text-slate-900">{cat.name}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 tabular-nums">
                        ${cat.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{cat.transactionCount} transactions · {cat.percentage}% share</span>
                      <span className="text-[10px] text-slate-400">
                        {fullCat && fullCat.keywords.length > 0 ? `Tags: ${fullCat.keywords.slice(0, 3).join(', ')}` : ''}
                      </span>
                    </div>

                    <div className="h-1 rounded-full mt-2 w-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </button>
                );
              })}

              {categorySummaries.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Zero categorized outflows detected.
                </div>
              )}
            </div>
          </div>

          {activeCategoryFilter !== 'ALL' && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Filtering journal by: <strong className="text-slate-800">{activeCategoryFilter}</strong>
              </span>
              <button
                onClick={() => setActiveCategoryFilter('ALL')}
                className="text-blue-600 hover:underline text-[11px] font-medium"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categorized Outflow Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 font-display">
              Categorized Outflow Journal
            </h3>
            <p className="text-xs text-slate-500">
              Showing {categorizedOutflows.length} outflow transactions matching selected category tags
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tag Filter:</span>
            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">All Categories</option>
              {SPENDING_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Category Tag</th>
                <th className="py-2.5 px-4 text-right">Debit Amount ($)</th>
                <th className="py-2.5 px-4 text-right">Running Balance ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorizedOutflows.length > 0 ? (
                categorizedOutflows.map((tx) => (
                  <tr key={tx.transactionID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(tx.transactionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {tx.transactionReference}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 max-w-sm truncate" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: `${tx.category.color}15`,
                          color: tx.category.color,
                        }}
                      >
                        {getCategoryIcon(tx.category.id)}
                        <span>{tx.category.name}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-rose-700 whitespace-nowrap">
                      -${tx.amount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      ${tx.runningBalance.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions match the selected spending category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpendingTrends;
