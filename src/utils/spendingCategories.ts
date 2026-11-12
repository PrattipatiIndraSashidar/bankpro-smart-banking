import { Transaction } from '../types';

export interface SpendingCategory {
  id: string;
  name: string;
  color: string;
  keywords: string[];
}

export const SPENDING_CATEGORIES: SpendingCategory[] = [
  {
    id: 'rent',
    name: 'Rent',
    color: '#2563eb', // blue-600
    keywords: ['rent', 'lease', 'mortgage', 'housing', 'apartment', 'landlord', 'realty'],
  },
  {
    id: 'utilities',
    name: 'Utilities',
    color: '#d97706', // amber-600
    keywords: ['utility', 'utilities', 'electric', 'power', 'water', 'gas', 'internet', 'wifi', 'broadband', 'coned', 'telecom'],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    color: '#059669', // emerald-600
    keywords: ['grocery', 'groceries', 'supermarket', 'whole foods', 'trader joe', 'market', 'safeway', 'kroger', 'provisions', 'food store'],
  },
  {
    id: 'dining',
    name: 'Dining & Entertainment',
    color: '#db2777', // pink-600
    keywords: ['dining', 'restaurant', 'cafe', 'coffee', 'bistro', 'dinner', 'lunch', 'breakfast', 'bar', 'entertainment', 'cinema', 'netflix', 'spotify'],
  },
  {
    id: 'transport',
    name: 'Transit & Transport',
    color: '#7c3aed', // purple-600
    keywords: ['transit', 'metro', 'subway', 'uber', 'lyft', 'taxi', 'gasoline', 'fuel', 'parking', 'airline', 'flight', 'rail', 'transport'],
  },
  {
    id: 'shopping',
    name: 'Shopping & Retail',
    color: '#0891b2', // cyan-600
    keywords: ['shopping', 'retail', 'amazon', 'target', 'apple', 'store', 'apparel', 'equipment', 'electronics', 'clothing'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Wellness',
    color: '#dc2626', // rose-600
    keywords: ['health', 'medical', 'pharmacy', 'rx', 'prescription', 'doctor', 'dental', 'clinic', 'hospital', 'wellness'],
  },
  {
    id: 'other',
    name: 'Other Outflows',
    color: '#64748b', // slate-500
    keywords: [],
  },
];

export function categorizeTransaction(tx: Transaction): SpendingCategory {
  const desc = (tx.description || '').toLowerCase();

  for (const cat of SPENDING_CATEGORIES) {
    if (cat.id === 'other') continue;
    if (cat.keywords.some((kw) => desc.includes(kw))) {
      return cat;
    }
  }
  return SPENDING_CATEGORIES.find((c) => c.id === 'other')!;
}

export interface MonthlyCategoryOutflow {
  monthKey: string; // e.g. "2024-01"
  monthLabel: string; // e.g. "Jan 2024"
  totalOutflow: number;
  [categoryId: string]: number | string; // amount per category
}

export interface CategorySummary {
  id: string;
  name: string;
  color: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export function computeMonthlyCategoryTrends(transactions: Transaction[]): {
  monthlyData: MonthlyCategoryOutflow[];
  categorySummaries: CategorySummary[];
  totalPeriodOutflow: number;
  highestCategory: CategorySummary | null;
  averageMonthlyOutflow: number;
} {
  // Only consider outflows: WITHDRAWAL or TRANSFER_DR
  const outflows = transactions.filter(
    (tx) => tx.transactionType === 'WITHDRAWAL' || tx.transactionType === 'TRANSFER_DR'
  );

  const monthMap: Record<string, MonthlyCategoryOutflow> = {};
  const categoryTotals: Record<string, { total: number; count: number }> = {};

  SPENDING_CATEGORIES.forEach((cat) => {
    categoryTotals[cat.id] = { total: 0, count: 0 };
  });

  outflows.forEach((tx) => {
    const d = new Date(tx.transactionDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });

    if (!monthMap[monthKey]) {
      const initialEntry: MonthlyCategoryOutflow = {
        monthKey,
        monthLabel,
        totalOutflow: 0,
      };
      SPENDING_CATEGORIES.forEach((cat) => {
        initialEntry[cat.id] = 0;
      });
      monthMap[monthKey] = initialEntry;
    }

    const cat = categorizeTransaction(tx);
    const currentVal = (monthMap[monthKey][cat.id] as number) || 0;
    monthMap[monthKey][cat.id] = Math.round((currentVal + tx.amount) * 100) / 100;
    monthMap[monthKey].totalOutflow = Math.round((monthMap[monthKey].totalOutflow + tx.amount) * 100) / 100;

    categoryTotals[cat.id].total += tx.amount;
    categoryTotals[cat.id].count += 1;
  });

  const sortedMonths = Object.keys(monthMap).sort();
  const monthlyData = sortedMonths.map((k) => monthMap[k]);

  const totalPeriodOutflow = Object.values(categoryTotals).reduce((sum, c) => sum + c.total, 0);

  const categorySummaries: CategorySummary[] = SPENDING_CATEGORIES.map((cat) => {
    const data = categoryTotals[cat.id];
    return {
      id: cat.id,
      name: cat.name,
      color: cat.color,
      totalAmount: Math.round(data.total * 100) / 100,
      transactionCount: data.count,
      percentage: totalPeriodOutflow > 0 ? Math.round((data.total / totalPeriodOutflow) * 1000) / 10 : 0,
    };
  })
    .filter((c) => c.totalAmount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

  const highestCategory = categorySummaries.length > 0 ? categorySummaries[0] : null;
  const averageMonthlyOutflow =
    monthlyData.length > 0 ? Math.round((totalPeriodOutflow / monthlyData.length) * 100) / 100 : 0;

  return {
    monthlyData,
    categorySummaries,
    totalPeriodOutflow: Math.round(totalPeriodOutflow * 100) / 100,
    highestCategory,
    averageMonthlyOutflow,
  };
}
