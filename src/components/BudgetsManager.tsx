'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  AlertTriangle, 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  ShoppingBag, 
  Utensils, 
  Car, 
  Tv, 
  FileText, 
  Heart, 
  TrendingUp,
  Percent,
  HelpCircle
} from 'lucide-react';
import styles from './BudgetsManager.module.css';
import CustomSelect from './CustomSelect';

interface Budget {
  id: number;
  category: string;
  limit: number;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  createdAt: string;
}

interface BudgetsManagerProps {
  initialBudgets: Budget[];
  currentMonthTransactions: Transaction[];
  walletBalance: number;
}

const CATEGORIES = [
  { value: 'SHOPPING', label: 'Shopping', icon: ShoppingBag, color: '#6366f1' },
  { value: 'FOOD', label: 'Food & Dining', icon: Utensils, color: '#f59e0b' },
  { value: 'TRAVEL', label: 'Travel & Transport', icon: Car, color: '#10b981' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: Tv, color: '#ec4899' },
  { value: 'BILLS', label: 'Bills & Utilities', icon: FileText, color: '#3b82f6' },
  { value: 'HEALTHCARE', label: 'Healthcare & Wellness', icon: Heart, color: '#ef4444' }
];

export default function BudgetsManager({ initialBudgets, currentMonthTransactions, walletBalance }: BudgetsManagerProps) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);
  const [formCategory, setFormCategory] = useState('SHOPPING');
  const [formLimit, setFormLimit] = useState('5000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Calculate actual outflow per category in the current month
  const categorySpending = useMemo(() => {
    const spendingMap: Record<string, number> = {};
    
    // Initialize spending for all standard categories
    CATEGORIES.forEach(c => {
      spendingMap[c.value] = 0;
    });

    // Sum matching transactions
    currentMonthTransactions.forEach(t => {
      const upperCat = t.category.toUpperCase();
      const isOutflow = t.type === 'WITHDRAWAL' || t.type === 'TRANSFER_OUT' || t.type === 'SAVINGS_CONTRIBUTION';
      
      if (isOutflow && spendingMap[upperCat] !== undefined) {
        spendingMap[upperCat] += t.amount;
      }
    });

    return spendingMap;
  }, [currentMonthTransactions]);

  // 2. Summary stats
  const summary = useMemo(() => {
    const totalAllocated = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = CATEGORIES.reduce((sum, c) => sum + (categorySpending[c.value] || 0), 0);
    const remaining = Math.max(totalAllocated - totalSpent, 0);
    const usePercent = totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0;
    
    const overspentCount = budgets.filter(b => {
      const spent = categorySpending[b.category] || 0;
      return spent > b.limit;
    }).length;

    return {
      totalAllocated,
      totalSpent,
      remaining,
      usePercent,
      overspentCount
    };
  }, [budgets, categorySpending]);

  // 3. Handle submit budget configuration
  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const limitVal = Number(formLimit);
    if (isNaN(limitVal) || limitVal < 0) {
      setError('Please enter a valid budget limit');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formCategory,
          limit: limitVal
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to configure budget');
      } else {
        setSuccess(`Successfully set budget for ${formCategory}`);
        
        // Update local budget state
        const existsIdx = budgets.findIndex(b => b.category === formCategory);
        if (existsIdx > -1) {
          const updated = [...budgets];
          updated[existsIdx] = data.budget;
          setBudgets(updated);
        } else {
          setBudgets([...budgets, data.budget]);
        }
        router.refresh();
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // AI/Heuristic recommendations based on budget setup
  const budgetRecommendations = useMemo(() => {
    const list = [];
    
    // Check if user has unconfigured budgets
    const configuredCategories = budgets.map(b => b.category);
    const unconfigured = CATEGORIES.filter(c => !configuredCategories.includes(c.value));
    
    if (unconfigured.length > 0) {
      list.push({
        type: 'info',
        text: `You have ${unconfigured.length} categories without custom budget limits. Setting limits on ${unconfigured[0].label} helps prevent leaks.`
      });
    }

    // Check for alerts
    if (summary.overspentCount > 0) {
      list.push({
        type: 'alert',
        text: `Attention: You are overspending in ${summary.overspentCount} categories. Review card timeline limits to freeze outflows.`
      });
    } else if (summary.usePercent > 85) {
      list.push({
        type: 'warning',
        text: `Budget Warning: You have consumed ${summary.usePercent.toFixed(0)}% of your overall monthly budget limit.`
      });
    } else if (summary.totalAllocated > walletBalance * 1.5) {
      list.push({
        type: 'warning',
        text: `Deficit Alert: Your monthly budget allocations (₹${summary.totalAllocated.toLocaleString()}) exceed your wallet balance.`
      });
    } else {
      list.push({
        type: 'success',
        text: 'All budgets are healthy and on track! Excellent financial governance this month.'
      });
    }

    return list;
  }, [budgets, summary, walletBalance]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2>Monthly Budget Planner</h2>
          <p className={styles.sub}>Allocate monthly limits per category and track outflows dynamically.</p>
        </div>
      </header>

      {error && <div className={styles.alertBoxError}>{error}</div>}
      {success && <div className={styles.alertBoxSuccess}>{success}</div>}

      {/* Overview stats & Allocation Forms */}
      <div className={styles.topLayout}>
        {/* Summary Card */}
        <div className={`${styles.summaryCard} glass-card`}>
          <h3>Budget Consumption</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span>Total Allocated</span>
              <strong>₹{summary.totalAllocated.toLocaleString()}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Total Outflow</span>
              <strong>₹{summary.totalSpent.toLocaleString()}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Remaining Limit</span>
              <strong>₹{summary.remaining.toLocaleString()}</strong>
            </div>
          </div>
          
          <div className={styles.progressContainer}>
            <div className={styles.progressBarWrapper}>
              <div 
                className={`${styles.progressBar} ${summary.usePercent >= 90 ? styles.progressAlert : summary.usePercent >= 70 ? styles.progressWarning : ''}`}
                style={{ width: `${summary.usePercent}%` }}
              ></div>
            </div>
            <div className={styles.progressLabel}>
              <span>{summary.usePercent.toFixed(0)}% Consumed</span>
              <span>₹{(summary.totalAllocated - summary.totalSpent).toLocaleString()} remaining</span>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <div className={`${styles.formCard} glass-card`}>
          <h3>
            <Coins size={18} className={styles.titleIcon} />
            <span>Configure Target Limits</span>
          </h3>
          <form onSubmit={handleSetBudget} className={styles.form}>
            <div className="input-group">
              <label htmlFor="categorySelect">Category</label>
              <CustomSelect
                value={formCategory}
                onChange={(val) => setFormCategory(val)}
                options={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                placeholder="Select a category"
              />
            </div>

            <div className="input-group">
              <div className={styles.sliderLabelRow}>
                <label htmlFor="limitSlider">Monthly Allowance Limit</label>
                <strong>₹{Number(formLimit).toLocaleString()}</strong>
              </div>
              <input 
                id="limitSlider"
                type="range" 
                min={1000} 
                max={50000} 
                step={500}
                value={formLimit}
                onChange={(e) => setFormLimit(e.target.value)}
                className={styles.sliderInput}
                disabled={loading}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹50,000</span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              <Plus size={16} />
              <span>{loading ? 'Configuring...' : 'Configure Limit'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Grid of budgets & recommendations */}
      <div className={styles.bottomLayout}>
        {/* Category Cards List */}
        <div className={styles.budgetsSection}>
          <h3 className={styles.sectionTitle}>Category Targets</h3>
          <div className={styles.budgetsGrid}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const budget = budgets.find(b => b.category === cat.value);
              const spent = categorySpending[cat.value] || 0;
              
              if (!budget) {
                return (
                  <div key={cat.value} className={`${styles.budgetCard} ${styles.cardUnconfigured} glass-card`}>
                    <div className={styles.cardTop}>
                      <div className={styles.iconBox} style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-muted)' }}>
                        <Icon size={20} />
                      </div>
                      <span className={styles.cardCatName}>{cat.label}</span>
                    </div>
                    <div className={styles.cardMid}>
                      <span className={styles.unconfiguredText}>No Budget Set</span>
                    </div>
                    <button 
                      onClick={() => {
                        setFormCategory(cat.value);
                        setFormLimit('5000');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '8px 12px', fontSize: '0.75rem', width: '100%', marginTop: 'auto' }}
                    >
                      Set Guard Limit
                    </button>
                  </div>
                );
              }

              const limit = budget.limit;
              const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const isOverspent = spent > limit;

              return (
                <div key={cat.value} className={`${styles.budgetCard} glass-card`}>
                  <div className={styles.cardTop}>
                    <div className={styles.iconBox} style={{ background: `${cat.color}15`, color: cat.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <span className={styles.cardCatName}>{cat.label}</span>
                      {isOverspent && <span className={styles.overspentBadge}>OVERSPENT</span>}
                    </div>
                  </div>

                  <div className={styles.cardMid}>
                    <div className={styles.cardSpentRow}>
                      <span>Spent: <strong>₹{spent.toLocaleString()}</strong></span>
                      <span className={styles.textMuted}>Limit: ₹{limit.toLocaleString()}</span>
                    </div>
                    <div className={styles.cardProgressBarWrapper}>
                      <div 
                        className={`${styles.cardProgressBar} ${isOverspent ? styles.progressAlert : percent >= 80 ? styles.progressWarning : ''}`}
                        style={{ width: `${percent}%`, backgroundColor: isOverspent ? 'var(--color-danger)' : cat.color }}
                      ></div>
                    </div>
                    <div className={styles.cardProgressFooter}>
                      <span>{percent.toFixed(0)}% Used</span>
                      <span className={isOverspent ? styles.textRed : styles.textGreen}>
                        {isOverspent 
                          ? `Over by ₹${(spent - limit).toLocaleString()}` 
                          : `₹${(limit - spent).toLocaleString()} left`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations sidebar */}
        <div className={`${styles.recommendationsCard} glass-card`}>
          <h3>
            <Sparkles size={18} className={styles.titleIcon} />
            <span>AI Budget Recommendations</span>
          </h3>
          <p className={styles.sectionDesc}>Data-driven alerts mapped from your budget allocations and spending patterns:</p>

          <div className={styles.recommendationsList}>
            {budgetRecommendations.map((rec, i) => (
              <div 
                key={i} 
                className={`${styles.recRow} ${
                  rec.type === 'alert' 
                    ? styles.recAlert 
                    : rec.type === 'warning' 
                    ? styles.recWarning 
                    : rec.type === 'success' 
                    ? styles.recSuccess 
                    : styles.recInfo
                }`}
              >
                {rec.type === 'alert' || rec.type === 'warning' ? (
                  <AlertTriangle size={18} className={styles.recIcon} />
                ) : rec.type === 'success' ? (
                  <CheckCircle2 size={18} className={styles.recIcon} />
                ) : (
                  <Sparkles size={18} className={styles.recIcon} />
                )}
                <p className={styles.recText}>{rec.text}</p>
              </div>
            ))}
          </div>

          <div className={styles.recommendationsFooter}>
            <p>
              Setting category budgets feeds into the AI Financial Analyst to create custom savings optimization alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
