'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  PiggyBank, 
  Coins, 
  Sparkles, 
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import styles from './AIInsightsClient.module.css';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  description: string;
  createdAt: string;
}

interface Budget {
  id: number;
  category: string;
  limit: number;
}

interface AIInsightsClientProps {
  transactions: Transaction[];
  savingsPotsCount: number;
  balance: number;
  budgets: Budget[];
}

export default function AIInsightsClient({ transactions, savingsPotsCount, balance, budgets = [] }: AIInsightsClientProps) {
  // Budget goal state initialized from actual DB configs, falling back to typical defaults
  const budgetLimits = useMemo(() => {
    const limits: Record<string, number> = {
      SHOPPING: 10000,
      FOOD: 5000,
      TRAVEL: 8000,
      ENTERTAINMENT: 5000,
      BILLS: 15000,
      HEALTHCARE: 10000,
    };
    budgets.forEach(b => {
      limits[b.category.toUpperCase()] = b.limit;
    });
    return limits;
  }, [budgets]);

  // Sliders state
  const [shoppingBudget, setShoppingBudget] = useState(() => budgetLimits.SHOPPING);
  const [diningBudget, setDiningBudget] = useState(() => budgetLimits.FOOD);
  const [travelBudget, setTravelBudget] = useState(() => budgetLimits.TRAVEL);
  const [entertainmentBudget, setEntertainmentBudget] = useState(() => budgetLimits.ENTERTAINMENT);
  const [billsBudget, setBillsBudget] = useState(() => budgetLimits.BILLS);
  const [healthcareBudget, setHealthcareBudget] = useState(() => budgetLimits.HEALTHCARE);

  // Keep sliders synced if backend configs change
  React.useEffect(() => {
    setShoppingBudget(budgetLimits.SHOPPING);
    setDiningBudget(budgetLimits.FOOD);
    setTravelBudget(budgetLimits.TRAVEL);
    setEntertainmentBudget(budgetLimits.ENTERTAINMENT);
    setBillsBudget(budgetLimits.BILLS);
    setHealthcareBudget(budgetLimits.HEALTHCARE);
  }, [budgetLimits]);

  const insightsData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // Filter transactions for this month and last month
    const thisMonthTxns = transactions.filter(t => {
      const d = new Date(t.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const lastMonthTxns = transactions.filter(t => {
      const d = new Date(t.createdAt);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getFullYear() === lastYear && d.getMonth() === lastMonth;
    });

    // Outflow types
    const isOutflow = (type: string) => 
      type === 'WITHDRAWAL' || type === 'TRANSFER_OUT' || type === 'SAVINGS_CONTRIBUTION';

    // Inflow types
    const isInflow = (type: string) => 
      type === 'DEPOSIT' || type === 'TRANSFER_IN' || type === 'SAVINGS_WITHDRAWAL';

    // Calculations for this month
    const thisMonthOutflow = thisMonthTxns
      .filter(t => isOutflow(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthInflow = thisMonthTxns
      .filter(t => isInflow(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    const thisMonthSavings = thisMonthTxns
      .filter(t => t.type === 'SAVINGS_CONTRIBUTION')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculations for last month
    const lastMonthOutflow = lastMonthTxns
      .filter(t => isOutflow(t.type))
      .reduce((sum, t) => sum + t.amount, 0);

    // Percentage differences
    let spendingChangePercent = 0;
    if (lastMonthOutflow > 0) {
      spendingChangePercent = Math.round(((thisMonthOutflow - lastMonthOutflow) / lastMonthOutflow) * 100);
    } else if (thisMonthOutflow > 0) {
      spendingChangePercent = 100; // default spike if no history
    }

    // Outflow by category
    const categoryTotals: Record<string, number> = {
      SHOPPING: 0,
      FOOD: 0,
      TRAVEL: 0,
      ENTERTAINMENT: 0,
      BILLS: 0,
      HEALTHCARE: 0,
    };
    thisMonthTxns.filter(t => isOutflow(t.type)).forEach(t => {
      const cat = t.category.toUpperCase();
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += t.amount;
      }
    });

    // Largest transaction this month
    const withdrawals = thisMonthTxns.filter(t => isOutflow(t.type));
    const largestTxn = withdrawals.length > 0
      ? withdrawals.reduce((max, t) => t.amount > max.amount ? t : max, withdrawals[0])
      : null;

    let topCategory = 'None';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt;
        topCategory = cat;
      }
    });

    return {
      thisMonthInflow,
      thisMonthOutflow,
      thisMonthSavings,
      spendingChangePercent,
      topCategory,
      topCategoryAmount,
      totalTxnsCount: thisMonthTxns.length,
      categoryTotals,
      largestTxn
    };
  }, [transactions]);

  // Generate dynamic tips based on user's actual spending data
  const tips = useMemo(() => {
    const list = [];
    const { categoryTotals, spendingChangePercent, thisMonthSavings, largestTxn, thisMonthOutflow } = insightsData;

    // Helper to evaluate categories against configured budget limits
    const checkBudget = (catName: string, spent: number, limit: number) => {
      if (spent > limit) {
        list.push({
          id: `budget-${catName}-over`,
          type: 'alert',
          title: `${catName} Allowance Exceeded`,
          desc: `You spent ₹${spent.toLocaleString()} on ${catName.toLowerCase()} this month, exceeding your limit of ₹${limit.toLocaleString()}.`,
          action: 'Lock or freeze virtual cards dedicated to this category to avoid additional charges.'
        });
      } else if (spent > limit * 0.8) {
        list.push({
          id: `budget-${catName}-warning`,
          type: 'warning',
          title: `Approaching ${catName} Limit`,
          desc: `You spent ₹${spent.toLocaleString()} on ${catName.toLowerCase()}. You have reached ${(spent/limit * 100).toFixed(0)}% of your ₹${limit.toLocaleString()} budget.`,
          action: `Only ₹${(limit - spent).toLocaleString()} remains for this category.`
        });
      } else if (spent > 0) {
        list.push({
          id: `budget-${catName}-ok`,
          type: 'success',
          title: `${catName} Budget Healthy`,
          desc: `Your spending on ${catName.toLowerCase()} (₹${spent.toLocaleString()}) is safely within your ₹${limit.toLocaleString()} threshold.`,
          action: `Remaining budget: ₹${(limit - spent).toLocaleString()}. Keep it up!`
        });
      }
    };

    checkBudget('SHOPPING', categoryTotals.SHOPPING, shoppingBudget);
    checkBudget('FOOD', categoryTotals.FOOD, diningBudget);
    checkBudget('TRAVEL', categoryTotals.TRAVEL, travelBudget);
    checkBudget('ENTERTAINMENT', categoryTotals.ENTERTAINMENT, entertainmentBudget);
    checkBudget('BILLS', categoryTotals.BILLS, billsBudget);
    checkBudget('HEALTHCARE', categoryTotals.HEALTHCARE, healthcareBudget);

    // Trend tip
    if (spendingChangePercent > 15) {
      list.push({
        id: 'spending-spike',
        type: 'alert',
        title: 'Spending Volatility Spike',
        desc: `Your overall monthly spending increased by ${spendingChangePercent}% compared to last month.`,
        action: 'Review your transaction logs to check for unexpected subscriptions or large transfers.'
      });
    } else if (spendingChangePercent < -5) {
      list.push({
        id: 'spending-saver',
        type: 'success',
        title: 'Expense Reduction Trend',
        desc: `Excellent! You spent ${Math.abs(spendingChangePercent)}% less this month compared to last month.`,
        action: 'Save this difference directly to secure your long-term goals.'
      });
    } else {
      list.push({
        id: 'spending-stable',
        type: 'info',
        title: 'Consistent Outflows',
        desc: 'Your monthly outflow remains stable compared to last month.',
        action: 'You are maintaining a predictable monthly budget.'
      });
    }

    // Savings tip
    if (thisMonthSavings > 0) {
      list.push({
        id: 'savings-good',
        type: 'success',
        title: 'Wealth Building Progress',
        desc: `You saved ₹${thisMonthSavings.toLocaleString()} in savings pots this month.`,
        action: 'Keep this pace up! Consistent additions amplify compound growth.'
      });
    } else if (thisMonthOutflow > 1000) {
      list.push({
        id: 'savings-alert',
        type: 'alert',
        title: 'No Active Savings Contribution',
        desc: 'You did not contribute to any savings pots this month, despite active spending.',
        action: 'Even a small ₹500 automatic recurring deposit helps build strong wealth habits.'
      });
    }

    // Largest transaction tip
    if (largestTxn) {
      list.push({
        id: 'largest-txn',
        type: 'info',
        title: 'Single Largest Transaction',
        desc: `Your largest outflow was ₹${largestTxn.amount.toLocaleString()} at "${largestTxn.description}" under ${largestTxn.category.toLowerCase()}.`,
        action: 'Ensure this corresponds to a planned expense or necessary transfer.'
      });
    }

    return list;
  }, [insightsData, shoppingBudget, diningBudget, travelBudget, entertainmentBudget, billsBudget, healthcareBudget]);

  const getTipIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className={styles.tipIconAlert} size={18} />;
      case 'success':
        return <CheckCircle className={styles.tipIconSuccess} size={18} />;
      default:
        return <Lightbulb className={styles.tipIconInfo} size={18} />;
    }
  };

  const getTipClass = (type: string) => {
    switch (type) {
      case 'alert':
        return styles.tipAlert;
      case 'success':
        return styles.tipSuccess;
      default:
        return styles.tipInfo;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoBadge}>
            <Sparkles className={styles.logoIcon} size={20} />
            <span>AI Powered</span>
          </div>
          <h2 className={styles.title}>Vortex Financial Insights</h2>
          <p className={styles.subtitle}>Smart ledger analysis, spending alerts, and personalized saving stashes.</p>
        </div>
      </header>

      {/* Main Heuristic Grid */}
      <section className={styles.statsGrid}>
        
        {/* Shopping Card */}
        <div className={`${styles.insightCard} glass-card`}>
          <div className={styles.cardHeader}>
            <ShoppingBag className={styles.iconShopping} size={20} />
            <span>Shopping Outflow</span>
          </div>
          <div className={styles.cardBody}>
            <h3 className={styles.statText}>₹{insightsData.categoryTotals.SHOPPING.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className={styles.statLabel}>Spent on shopping this month</p>
          </div>
          <div className={styles.cardFooter}>
            <span>Limit set: ₹{shoppingBudget.toLocaleString()}</span>
          </div>
        </div>

        {/* Change percent card */}
        <div className={`${styles.insightCard} glass-card`}>
          <div className={styles.cardHeader}>
            {insightsData.spendingChangePercent >= 0 ? (
              <TrendingUp className={styles.iconRed} size={20} />
            ) : (
              <TrendingDown className={styles.iconGreen} size={20} />
            )}
            <span>Outflow Trend</span>
          </div>
          <div className={styles.cardBody}>
            <h3 className={`${styles.statText} ${insightsData.spendingChangePercent >= 0 ? styles.textRed : styles.textGreen}`}>
              {insightsData.spendingChangePercent >= 0 ? '+' : ''}
              {insightsData.spendingChangePercent}%
            </h3>
            <p className={styles.statLabel}>Change since last calendar month</p>
          </div>
          <div className={styles.cardFooter}>
            <span>Compared to prior month outflow</span>
          </div>
        </div>

        {/* Savings Card */}
        <div className={`${styles.insightCard} glass-card`}>
          <div className={styles.cardHeader}>
            <PiggyBank className={styles.iconSavings} size={20} />
            <span>Accumulated Savings</span>
          </div>
          <div className={styles.cardBody}>
            <h3 className={styles.statText}>₹{insightsData.thisMonthSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className={styles.statLabel}>Added to savings pots this month</p>
          </div>
          <div className={styles.cardFooter}>
            <span>{savingsPotsCount} active stashes monitored</span>
          </div>
        </div>
      </section>

      {/* Two Column Layout for Budget Tool & Suggestions */}
      <div className={styles.detailsGrid}>
        
        {/* Interactive Budget Simulator */}
        <div className={`${styles.budgetSimulator} glass-card`}>
          <h3 className={styles.sectionTitle}>
            <Coins size={18} className={styles.titleIcon} />
            <span>Interactive Budget Alert Tool</span>
          </h3>
          <p className={styles.sectionDesc}>Simulate safety alerts by adjusting your monthly category allowance thresholds below:</p>

          <div className={styles.budgetSliders}>
            
            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Shopping Allowance</span>
                <strong>₹{shoppingBudget.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={20000} 
                step={500}
                value={shoppingBudget}
                onChange={(e) => setShoppingBudget(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹20,000</span>
              </div>
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Dining & Food Allowance</span>
                <strong>₹{diningBudget.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={15000} 
                step={500}
                value={diningBudget}
                onChange={(e) => setDiningBudget(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹15,000</span>
              </div>
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Travel Allowance</span>
                <strong>₹{travelBudget.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={30000} 
                step={1000}
                value={travelBudget}
                onChange={(e) => setTravelBudget(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹30,000</span>
              </div>
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Entertainment Allowance</span>
                <strong>₹{entertainmentBudget.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={20000} 
                step={500}
                value={entertainmentBudget}
                onChange={(e) => setEntertainmentBudget(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹20,000</span>
              </div>
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Bills & Utilities Allowance</span>
                <strong>₹{billsBudget.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={50000} 
                step={1000}
                value={billsBudget}
                onChange={(e) => setBillsBudget(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹50,000</span>
              </div>
            </div>

            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabelRow}>
                <span>Healthcare Allowance</span>
                <strong>₹{healthcareBudget.toLocaleString()}</strong>
              </div>
              <input 
                type="range" 
                min={1000} 
                max={30000} 
                step={1000}
                value={healthcareBudget}
                onChange={(e) => setHealthcareBudget(Number(e.target.value))}
                className={styles.rangeInput}
              />
              <div className={styles.sliderTicks}>
                <span>₹1,000</span>
                <span>₹30,000</span>
              </div>
            </div>

          </div>

          <div className={styles.simulatorFooter}>
            <p className={styles.footerNote}>
              Adjusting sliders updates AI recommendations instantly. These values are saved locally for active session testing.
            </p>
          </div>
        </div>

        {/* AI Actionable Recommendations */}
        <div className={`${styles.recommendationsSection} glass-card`}>
          <h3 className={styles.sectionTitle}>
            <Sparkles size={18} className={styles.titleIcon} />
            <span>Personalized Spending Insights</span>
          </h3>
          <p className={styles.sectionDesc}>Heuristic recommendations compiled from your current account activity:</p>

          <div className={styles.tipsList}>
            {tips.map((tip) => (
              <div key={tip.id} className={`${styles.tipRow} ${getTipClass(tip.type)}`}>
                <div className={styles.tipLeft}>
                  {getTipIcon(tip.type)}
                  <div className={styles.tipText}>
                    <h4 className={styles.tipTitle}>{tip.title}</h4>
                    <p className={styles.tipDesc}>{tip.desc}</p>
                    <p className={styles.tipAction}>
                      <ArrowRight size={12} className={styles.arrowIcon} />
                      <span>{tip.action}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
