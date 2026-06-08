'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingDown, 
  Percent, 
  Calendar, 
  Coins, 
  Activity 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  BarChart, 
  Bar 
} from 'recharts';
import styles from './DashboardCharts.module.css';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  status: string;
  description: string;
  createdAt: Date | string;
}

interface DashboardChartsProps {
  transactions: Transaction[];
  currentBalance: number;
}

export default function DashboardCharts({ transactions, currentBalance }: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<'growth' | 'weekly' | 'comparison'>('growth');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Calculate dynamic fintech metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthTxns = transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthTxns = transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
    });

    // Inflow sum (Deposits + Transfers In + savings pot withdrawals)
    const totalIncome = transactions
      .filter(t => t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'SAVINGS_WITHDRAWAL')
      .reduce((sum, t) => sum + t.amount, 0);

    // Outflow sum (Withdrawals + Transfers Out + savings pot additions)
    const totalExpenses = transactions
      .filter(t => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'SAVINGS_CONTRIBUTION')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpenses;

    // Monthly Growth %
    const thisMonthInflow = thisMonthTxns
      .filter(t => t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthInflow = lastMonthTxns
      .filter(t => t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN')
      .reduce((sum, t) => sum + t.amount, 0);

    let monthlyGrowth = 0;
    if (lastMonthInflow > 0) {
      monthlyGrowth = ((thisMonthInflow - lastMonthInflow) / lastMonthInflow) * 100;
    } else if (thisMonthInflow > 0) {
      monthlyGrowth = 100;
    }

    // Average Daily Spending (current month)
    const elapsedDays = now.getDate();
    const thisMonthOutflow = thisMonthTxns
      .filter(t => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'SAVINGS_CONTRIBUTION')
      .reduce((sum, t) => sum + t.amount, 0);
    const avgDailySpending = elapsedDays > 0 ? thisMonthOutflow / elapsedDays : 0;

    // Highest transaction recorded
    const highestTransaction = transactions.length > 0
      ? Math.max(...transactions.map(t => t.amount))
      : 0;

    // Average transaction amount
    const avgTransactionAmount = transactions.length > 0
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
      : 0;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      monthlyGrowth,
      avgDailySpending,
      highestTransaction,
      avgTransactionAmount
    };
  }, [transactions]);

  // 2. Generate historical growth data (Area Chart)
  const growthData = useMemo(() => {
    const data = [];
    const now = new Date();
    const sortedTxns = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate balance at end of each day for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      targetDate.setHours(23, 59, 59, 999);

      let balanceAtDate = currentBalance;
      for (const tx of sortedTxns) {
        const txDate = new Date(tx.createdAt);
        if (txDate > targetDate) {
          const isPositive = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' || tx.type === 'SAVINGS_WITHDRAWAL';
          if (isPositive) {
            balanceAtDate -= tx.amount;
          } else {
            balanceAtDate += tx.amount;
          }
        } else {
          break;
        }
      }

      data.push({
        date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Balance: Math.round(balanceAtDate)
      });
    }
    return data;
  }, [transactions, currentBalance]);

  // 3. Generate weekly balance trend data (Line Chart)
  const weeklyData = useMemo(() => {
    const data = [];
    const now = new Date();
    const sortedTxns = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      targetDate.setHours(23, 59, 59, 999);

      let balanceAtDate = currentBalance;
      for (const tx of sortedTxns) {
        const txDate = new Date(tx.createdAt);
        if (txDate > targetDate) {
          const isPositive = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' || tx.type === 'SAVINGS_WITHDRAWAL';
          if (isPositive) {
            balanceAtDate -= tx.amount;
          } else {
            balanceAtDate += tx.amount;
          }
        } else {
          break;
        }
      }

      data.push({
        day: targetDate.toLocaleDateString('en-US', { weekday: 'short' }),
        Balance: Math.round(balanceAtDate)
      });
    }
    return data;
  }, [transactions, currentBalance]);

  // 4. Generate monthly comparison data (Bar Chart)
  const monthlyComparisonData = useMemo(() => {
    const data = [];
    const now = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();

      const monthTxns = transactions.filter(t => {
        const d = new Date(t.createdAt);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
      });

      const income = monthTxns
        .filter(t => t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'SAVINGS_WITHDRAWAL')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTxns
        .filter(t => t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'SAVINGS_CONTRIBUTION')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        month: monthNames[targetMonth],
        Income: Math.round(income),
        Expenses: Math.round(expenses)
      });
    }
    return data;
  }, [transactions]);

  // Tooltip formatter helper
  const formatTooltipValue = (value: any) => {
    return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (!mounted) {
    // Elegant loading skeletons to avoid Next.js server side mismatches
    return (
      <div className={`${styles.chartCard} ${styles.loadingSkeleton}`}>
        <div className={styles.chartHeader}>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonTabs}></div>
        </div>
        <div className={styles.statsSummary}>
          <div className={styles.skeletonStatBox}></div>
          <div className={styles.skeletonStatBox}></div>
        </div>
        <div className={styles.skeletonChartArea}></div>
      </div>
    );
  }

  return (
    <div className={styles.chartCard}>
      {/* Chart Header */}
      <div className={styles.chartHeader}>
        <div>
          <h3>Financial Analytics</h3>
          <p className={styles.sub}>Interactive tracking of your liquid capital</p>
        </div>
        <div className={styles.tabs}>
          <button 
            onClick={() => setActiveTab('growth')} 
            className={`${styles.tabBtn} ${activeTab === 'growth' ? styles.active : ''}`}
          >
            Growth
          </button>
          <button 
            onClick={() => setActiveTab('weekly')} 
            className={`${styles.tabBtn} ${activeTab === 'weekly' ? styles.active : ''}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setActiveTab('comparison')} 
            className={`${styles.tabBtn} ${activeTab === 'comparison' ? styles.active : ''}`}
          >
            Inflow/Outflow
          </button>
        </div>
      </div>

      {/* Primary Summary Stats */}
      <div className={styles.statsSummary}>
        <div className={styles.statBox}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-primary)' }}>
            <ArrowUpRight size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Total Income</span>
            <p className={styles.statValue}>₹{metrics.totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }}>
            <ArrowDownRight size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Total Expenses</span>
            <p className={styles.statValue}>₹{metrics.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.statIconWrapper} style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-secondary)' }}>
            <Coins size={18} />
          </div>
          <div>
            <span className={styles.statLabel}>Net Savings</span>
            <p className={styles.statValue}>₹{metrics.netSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className={styles.chartWrapper}>
        {activeTab === 'growth' && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000) + 'k' : v}`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface-opaque)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                formatter={formatTooltipValue}
              />
              <Area type="monotone" dataKey="Balance" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#growthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'weekly' && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface-opaque)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                formatter={formatTooltipValue}
              />
              <Line type="monotone" dataKey="Balance" stroke="var(--color-secondary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'comparison' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip 
                contentStyle={{ background: 'var(--bg-surface-opaque)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                formatter={formatTooltipValue}
              />
              <Bar dataKey="Income" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Secondary Sub-metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Monthly Inflow Growth</span>
          <div className={styles.metricRow}>
            {metrics.monthlyGrowth >= 0 ? (
              <TrendingUp size={16} className={styles.iconGreen} />
            ) : (
              <TrendingDown size={16} className={styles.iconRed} />
            )}
            <span className={`${styles.metricValue} ${metrics.monthlyGrowth >= 0 ? styles.textGreen : styles.textRed}`}>
              {metrics.monthlyGrowth >= 0 ? '+' : ''}{metrics.monthlyGrowth.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Avg Daily Outflow</span>
          <div className={styles.metricRow}>
            <Activity size={16} className={styles.iconPrimary} />
            <span className={styles.metricValue}>₹{metrics.avgDailySpending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Highest Ledger Amount</span>
          <div className={styles.metricRow}>
            <ArrowUpRight size={16} className={styles.iconSecondary} />
            <span className={styles.metricValue}>₹{metrics.highestTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Average Txn Value</span>
          <div className={styles.metricRow}>
            <Percent size={16} className={styles.iconPrimary} />
            <span className={styles.metricValue}>₹{metrics.avgTransactionAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
