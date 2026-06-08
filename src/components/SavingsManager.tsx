'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, PiggyBank, Trash2, X, PlusCircle, AlertCircle, Clock, Award, TrendingUp, Sparkles } from 'lucide-react';
import styles from './SavingsManager.module.css';

interface SavingsPot {
  id: number;
  name: string;
  targetAmount: number;
  currentBalance: number;
}

interface SavingsManagerProps {
  initialPots: SavingsPot[];
  walletBalance: number;
  transactions?: any[];
}

export default function SavingsManager({ initialPots, walletBalance, transactions = [] }: SavingsManagerProps) {
  const router = useRouter();
  const [pots, setPots] = useState<SavingsPot[]>(initialPots);
  const [currentWalletBalance, setCurrentWalletBalance] = useState(walletBalance);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create Pot Dialog States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [potName, setPotName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  // Transfer Funds Dialog States
  const [activePotForAction, setActivePotForAction] = useState<SavingsPot | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | null>(null);
  const [transferAmount, setTransferAmount] = useState('');

  // 1. Calculate Savings Velocity (Contributions in the last 30 days)
  const monthlySavingRate = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Sum deposits in last 30 days
    const recentSavings = transactions
      .filter(t => t.type === 'SAVINGS_CONTRIBUTION' && new Date(t.createdAt) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);
      
    if (recentSavings > 0) return recentSavings;
    
    // Fallback: overall monthly average
    const totalSavings = transactions
      .filter(t => t.type === 'SAVINGS_CONTRIBUTION')
      .reduce((sum, t) => sum + t.amount, 0);
    if (totalSavings === 0) return 0;
    
    const dates = transactions.map(t => new Date(t.createdAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const diffMonths = Math.max(1, (maxDate - minDate) / (30 * 24 * 60 * 60 * 1000));
    
    return totalSavings / diffMonths;
  }, [transactions]);

  // 2. Calculate Savings Streak (Consecutive days with at least one contribution)
  const savingsStreak = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    const contributions = transactions
      .filter(t => t.type === 'SAVINGS_CONTRIBUTION')
      .map(t => new Date(t.createdAt));
      
    if (contributions.length === 0) return 0;

    // Format dates as YYYY-MM-DD
    const contributionDates = Array.from(
      new Set(contributions.map(d => d.toISOString().slice(0, 10)))
    ).sort().reverse(); // Newer dates first

    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    if (contributionDates[0] !== todayStr && contributionDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let lastDate = new Date(contributionDates[0]);
    
    for (let i = 1; i < contributionDates.length; i++) {
      const currentDate = new Date(contributionDates[i]);
      const diffTime = Math.abs(lastDate.getTime() - currentDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        lastDate = currentDate;
      } else if (diffDays > 1) {
        break;
      }
    }

    return streak;
  }, [transactions]);

  // 3. Overall Savings Stats
  const totalGoalAmount = pots.reduce((sum, p) => sum + p.targetAmount, 0);
  const totalStashedReserves = pots.reduce((sum, p) => sum + p.currentBalance, 0);
  const overallCompletionPercent = totalGoalAmount > 0 
    ? Math.min(Math.round((totalStashedReserves / totalGoalAmount) * 100), 100)
    : 0;

  const getCompletionEstimate = (pot: SavingsPot) => {
    const remaining = pot.targetAmount - pot.currentBalance;
    if (remaining <= 0) return 'Goal Completed! 🏆';
    if (monthlySavingRate <= 0) return 'Regular saving estimates date';
    
    const months = remaining / monthlySavingRate;
    if (months < 1) {
      const days = Math.round(months * 30);
      return `Est: ${days} day${days !== 1 ? 's' : ''}`;
    }
    if (months > 24) {
      return `Est: ${(months / 12).toFixed(1)} years`;
    }
    return `Est: ${Math.round(months)} month${Math.round(months) !== 1 ? 's' : ''}`;
  };

  const getMilestoneLabel = (percent: number) => {
    if (percent === 100) return 'Completed!';
    if (percent >= 90) return 'Almost there!';
    if (percent >= 75) return 'Final stretch!';
    if (percent >= 50) return 'Halfway point!';
    if (percent >= 25) return 'Great progress!';
    if (percent > 0) return 'Stash started!';
    return 'Goal set';
  };

  const handleCreatePot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!potName.trim() || !targetAmount || Number(targetAmount) <= 0) {
      setError('Please enter a valid name and goal target');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/savings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: potName, targetAmount: Number(targetAmount) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create savings goal');
      } else {
        setPots([...pots, data.pot]);
        setSuccess(`Savings goal "${data.pot.name}" created successfully!`);
        setShowCreateForm(false);
        setPotName('');
        setTargetAmount('');
        router.refresh();
      }
    } catch (err) {
      setError('Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleFundAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePotForAction || !actionType) return;
    
    setError('');
    setSuccess('');

    const amt = Number(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      const endpoint = `/api/savings/${actionType}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ potId: activePotForAction.id, amount: amt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Transaction failed');
      } else {
        setPots(pots.map(p => p.id === activePotForAction.id ? data.pot : p));
        setCurrentWalletBalance(data.walletBalance);
        
        setSuccess(data.message);
        setActivePotForAction(null);
        setActionType(null);
        setTransferAmount('');
        router.refresh();
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePot = async (potId: number) => {
    const targetPot = pots.find(p => p.id === potId);
    if (!targetPot) return;

    const confirmMsg = targetPot.currentBalance > 0
      ? `Deleting "${targetPot.name}" will refund the remaining balance of ₹${targetPot.currentBalance.toLocaleString()} back to your wallet. Continue?`
      : `Are you sure you want to delete the "${targetPot.name}" savings goal?`;

    if (!confirm(confirmMsg)) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/savings/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ potId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to delete pot');
      } else {
        setPots(pots.filter(p => p.id !== potId));
        if (targetPot.currentBalance > 0) {
          setCurrentWalletBalance(prev => prev + targetPot.currentBalance);
        }
        setSuccess(data.message);
        router.refresh();
      }
    } catch (err) {
      setError('Failed to connect to server.');
    }
  };

  return (
    <div className={styles.managerContainer}>
      <div className={styles.headerRow}>
        <div>
          <h2>Savings Pots & Goals</h2>
          <p className={styles.sub}>Set targets, stash reserves, and track your achievements</p>
        </div>
        
        <button 
          onClick={() => { setShowCreateForm(true); setError(''); setSuccess(''); }} 
          className="btn btn-primary"
          disabled={showCreateForm}
        >
          <PlusCircle size={16} />
          <span>New Goal Pot</span>
        </button>
      </div>

      {/* Analytics Summary Cards Bar */}
      <section className={styles.analyticsRow}>
        <div className="glass-card" style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stashed Reserves</span>
          <strong style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{totalStashedReserves.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Of ₹{totalGoalAmount.toLocaleString()} total target goals ({overallCompletionPercent}%)
          </span>
        </div>

        <div className="glass-card" style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Savings Rate</span>
          <strong style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{monthlySavingRate.toLocaleString('en-IN', { minimumFractionDigits: 0 })}/mo
          </strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Average stashed velocity (30d)</span>
        </div>

        <div className="glass-card" style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings Streak</span>
          <strong style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>
            {savingsStreak} Day{savingsStreak !== 1 ? 's' : ''} 🔥
          </strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Consecutive savings deposits active</span>
        </div>
      </section>

      {/* Account Info summary bar */}
      <div className={`${styles.balanceSummary} glass-card`}>
        <span>Wallet Balance available to save:</span>
        <strong>₹{currentWalletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
      </div>

      {error && <div className={styles.alertBoxError}>{error}</div>}
      {success && <div className={styles.alertBoxSuccess}>{success}</div>}

      {/* CREATE NEW POT DIALOG */}
      {showCreateForm && (
        <div className={styles.overlay}>
          <div className={styles.dialogCard}>
            <div className={styles.dialogHeader}>
              <h3>Create Savings Pot</h3>
              <button onClick={() => setShowCreateForm(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreatePot} className={styles.dialogForm}>
              <div className="input-group">
                <label htmlFor="goalName">Goal / Pot Name</label>
                <input
                  id="goalName"
                  type="text"
                  className="input-field"
                  placeholder="e.g. New Macbook Pro, Home Renovations"
                  value={potName}
                  onChange={(e) => setPotName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="target">Target Amount (INR)</label>
                <input
                  id="target"
                  type="number"
                  min="100"
                  className="input-field"
                  placeholder="e.g. 50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                />
              </div>

              <div className={styles.dialogActions}>
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Pot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD/WITHDRAW FUNDS DIALOG */}
      {activePotForAction && actionType && (
        <div className={styles.overlay}>
          <div className={styles.dialogCard}>
            <div className={styles.dialogHeader}>
              <h3>
                {actionType === 'deposit' ? 'Add Funds' : 'Withdraw Funds'} - {activePotForAction.name}
              </h3>
              <button 
                onClick={() => { setActivePotForAction(null); setActionType(null); }} 
                className={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleFundAction} className={styles.dialogForm}>
              <div className={styles.potDetailsSummary}>
                <div>
                  <span>Current Pot Balance</span>
                  <strong>₹{activePotForAction.currentBalance.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Target Goal</span>
                  <strong>₹{activePotForAction.targetAmount.toLocaleString()}</strong>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="transferAmt">Amount (INR)</label>
                <input
                  id="transferAmt"
                  type="number"
                  min="1"
                  max={actionType === 'deposit' ? currentWalletBalance : activePotForAction.currentBalance}
                  className="input-field"
                  placeholder="Enter amount to move"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                />
                <span className={styles.dialogHelpText}>
                  {actionType === 'deposit' 
                    ? `Max allocation: ₹${currentWalletBalance.toLocaleString()}`
                    : `Max withdrawal: ₹${activePotForAction.currentBalance.toLocaleString()}`
                  }
                </span>
              </div>

              <div className={styles.dialogActions}>
                <button 
                  type="button" 
                  onClick={() => { setActivePotForAction(null); setActionType(null); }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI SAVING POT RECOMMENDATIONS BANNER */}
      {pots.length > 0 && (
        <div className={`${styles.aiBanner} glass-card`}>
          <div className={styles.aiBannerLeft}>
            <Sparkles className={styles.aiSparkIcon} size={22} />
            <div>
              <h5>Vortex Automated Pot Advisor</h5>
              <p>
                {monthlySavingRate > 0 
                  ? `You are saving an average of ₹${monthlySavingRate.toLocaleString('en-IN', { maximumFractionDigits: 0 })} per month. Keep stashing to achieve your milestones ahead of schedule!` 
                  : 'Start saving regularly to activate the automated milestone predictor. Even tiny stashes build streaks!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SAVINGS POTS LIST GRID */}
      {pots.length === 0 ? (
        <div className={`${styles.emptyState} glass-card`}>
          <PiggyBank size={48} className={styles.emptyIcon} />
          <h3>No Goal Pots Created</h3>
          <p>Allocate some funds from your core account into dedicated pots. Perfect for budgeting and milestone tracking.</p>
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
            Create First Pot
          </button>
        </div>
      ) : (
        <div className={styles.potsGrid}>
          {pots.map((pot) => {
            const percent = Math.min(Math.round((pot.currentBalance / pot.targetAmount) * 100), 100);
            
            return (
              <div key={pot.id} className={`${styles.potCard} glass-card`}>
                <div className={styles.potCardHeader}>
                  <div className={styles.potHeaderLeft}>
                    <div className={styles.potIconBox}>
                      <PiggyBank size={20} className={styles.potIcon} />
                    </div>
                    <div>
                      <h4>{pot.name}</h4>
                      <span className={styles.potTarget}>Goal target: ₹{pot.targetAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePot(pot.id)}
                    className={styles.deleteBtn}
                    title="Delete Savings Pot"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.potCardBody}>
                  <div className={styles.progressRow}>
                    <span className={styles.balanceDisplay}>₹{pot.currentBalance.toLocaleString()}</span>
                    <span className={styles.percentDisplay}>{percent}%</span>
                  </div>

                  <div className={styles.barContainer}>
                    <div 
                      className={styles.barFiller} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  <div className={styles.potMetaRow}>
                    <span className={styles.potMilestone}>{getMilestoneLabel(percent)}</span>
                    <span className={styles.potEstimate}>{getCompletionEstimate(pot)}</span>
                  </div>
                </div>

                <div className={styles.potCardActions}>
                  <button 
                    onClick={() => { setActivePotForAction(pot); setActionType('withdraw'); setError(''); setSuccess(''); }}
                    className={`${styles.actionBtn} btn btn-secondary`}
                    disabled={pot.currentBalance <= 0}
                  >
                    <Minus size={14} />
                    <span>Withdraw</span>
                  </button>
                  <button 
                    onClick={() => { setActivePotForAction(pot); setActionType('deposit'); setError(''); setSuccess(''); }}
                    className={`${styles.actionBtn} btn btn-secondary`}
                    disabled={currentWalletBalance <= 0 || percent >= 100}
                  >
                    <Plus size={14} />
                    <span>Add Money</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
