import React from 'react';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import DashboardCharts from '@/components/DashboardCharts';
import ActivityFeed from '@/components/ActivityFeed';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  Plus, 
  Minus, 
  Send, 
  CreditCard, 
  TrendingUp, 
  ShieldCheck, 
  PiggyBank,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import styles from './page.module.css';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const allTransactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  // AI Insights Banner metrics calculation
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const shoppingTxns = await db.transaction.findMany({
    where: {
      userId: user.id,
      category: 'SHOPPING',
      createdAt: { gte: startOfMonth },
      type: { in: ['WITHDRAWAL', 'TRANSFER_OUT', 'SAVINGS_CONTRIBUTION'] }
    }
  });
  const shoppingTotal = shoppingTxns.reduce((sum, t) => sum + t.amount, 0);

  const savingsTxns = await db.transaction.findMany({
    where: {
      userId: user.id,
      type: 'SAVINGS_CONTRIBUTION',
      createdAt: { gte: startOfMonth }
    }
  });
  const savingsTotal = savingsTxns.reduce((sum, t) => sum + t.amount, 0);

  const activities = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const mappedActivities = activities.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    content: n.content,
    createdAt: n.createdAt.toISOString()
  }));

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const getCardLogo = (num: string) => {
    return num.startsWith('4') ? 'Visa' : 'Mastercard';
  };

  return (
    <div className={`${styles.dashboardGrid} animated-fade-in`}>
      
      {/* LEFT COLUMN: Balance, Chart, and Transactions */}
      <div className={styles.leftCol}>
        
        {/* Balances Card */}
        <section className={`${styles.balanceCard} glass-card`}>
          <div className={styles.cardGlowOverlay}></div>
          <div className={styles.balanceInfo}>
            <p className={styles.cardLabel}>Available Balance</p>
            <h2 className={styles.balanceText}>₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <div className={styles.accountNoRow}>
              <span>Status: <strong className={styles.statusVerified}>Active</strong></span>
              <span className={styles.divider}>•</span>
              <span>Account ID: <strong>{user.accountNo}</strong></span>
            </div>
          </div>
          
          <div className={styles.quickActions}>
            <Link href="/dashboard/transfer?action=deposit" className={`${styles.actionBtn} btn btn-secondary`}>
              <Plus size={16} />
              <span>Deposit</span>
            </Link>
            <Link href="/dashboard/transfer?action=withdraw" className={`${styles.actionBtn} btn btn-secondary`}>
              <Minus size={16} />
              <span>Withdraw</span>
            </Link>
            <Link href="/dashboard/transfer?action=transfer" className={`${styles.actionBtn} btn btn-primary`}>
              <Send size={16} />
              <span>Send Money</span>
            </Link>
          </div>
        </section>

        {/* AI Insight Hero Banner */}
        <div className={`${styles.aiInsightBanner} glass-card`}>
          <div className={styles.aiBannerLeft}>
            <div className={styles.aiSparkleIcon}>
              <Sparkles size={18} />
            </div>
            <div className={styles.aiBannerText}>
              <h4>AI Financial Analyst</h4>
              <p>
                You spent <strong>₹{shoppingTotal.toLocaleString('en-IN')}</strong> on shopping and saved <strong>₹{savingsTotal.toLocaleString('en-IN')}</strong> in pots this month.
              </p>
            </div>
          </div>
          <Link href="/dashboard/insights" className={`${styles.aiBannerBtn} btn btn-secondary btn-sm`} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <span>View AI Insights</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Analytics Chart */}
        <section>
          <DashboardCharts transactions={allTransactions} currentBalance={user.balance} />
        </section>

        {/* Recent Transactions List */}
        <section className={`${styles.transactionsSection} glass-card`}>
          <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
            <Link href="/dashboard/history" className={styles.headerLink}>View All</Link>
          </div>

          <div className={styles.transactionsList}>
            {user.transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <ArrowRightLeft size={36} className={styles.emptyIcon} />
                <p>No transactions made yet.</p>
                <Link href="/dashboard/transfer?action=deposit" className={styles.emptyLink}>Make a Deposit</Link>
              </div>
            ) : (
              user.transactions.slice(0, 5).map((t) => {
                const isPositive = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN';
                const date = new Date(t.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });

                return (
                  <div key={t.id} className={styles.transactionRow}>
                    <div className={styles.transLeft}>
                      <div className={`${styles.transIconWrapper} ${isPositive ? styles.positiveBg : styles.negativeBg}`}>
                        {isPositive ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                      </div>
                      <div className={styles.transDetails}>
                        <p className={styles.transDesc}>{t.description}</p>
                        <p className={styles.transMeta}>
                          {date} • {t.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className={`${styles.transAmount} ${isPositive ? styles.positiveText : styles.negativeText}`}>
                      {isPositive ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: Virtual Cards & Savings Pots Summary */}
      <div className={styles.rightCol}>
        
        {/* Virtual Cards Widget */}
        <section className={`${styles.widgetCard} glass-card`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetHeaderLeft}>
              <CreditCard size={18} className={styles.iconSecondary} />
              <h3>My Virtual Cards</h3>
            </div>
            <Link href="/dashboard/cards" className={styles.widgetHeaderLink}>Manage</Link>
          </div>

          <div className={styles.widgetBody}>
            {user.cards.length === 0 ? (
              <div className={styles.widgetEmpty}>
                <p>Secure your online payments with a dynamic virtual card.</p>
                <Link href="/dashboard/cards" className="btn btn-primary btn-sm" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Generate Card
                </Link>
              </div>
            ) : (
              user.cards.map((c) => (
                <div key={c.id} className={`${styles.cardPreview} ${c.status === 'FROZEN' ? styles.frozenCard : ''}`}>
                  <div className={styles.cardPreviewTop}>
                    <span className={styles.bankName}>Vortex Virtual</span>
                    <span className={styles.cardBrand}>{getCardLogo(c.cardNumber)}</span>
                  </div>
                  <div className={styles.cardPreviewMiddle}>
                    <span className={styles.cardNumberMask}>•••• •••• •••• {c.cardNumber.slice(-4)}</span>
                  </div>
                  <div className={styles.cardPreviewBottom}>
                    <div className={styles.cardHolderRow}>
                      <span className={styles.cardHolderLabel}>Card Holder</span>
                      <span className={styles.cardHolderValue}>{user.name}</span>
                    </div>
                    <div className={styles.cardExpiryRow}>
                      <span className={styles.cardExpiryLabel}>Expires</span>
                      <span className={styles.cardExpiryValue}>{c.expiry}</span>
                    </div>
                  </div>
                  {c.status === 'FROZEN' && (
                    <div className={styles.frozenOverlay}>
                      <span>FROZEN</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Savings Pots Widget */}
        <section className={`${styles.widgetCard} glass-card`}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetHeaderLeft}>
              <PiggyBank size={18} className={styles.iconSecondary} />
              <h3>Savings Pots</h3>
            </div>
            <Link href="/dashboard/savings" className={styles.widgetHeaderLink}>View All</Link>
          </div>

          <div className={styles.widgetBody} style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
            {user.savingsPots.length === 0 ? (
              <div className={styles.widgetEmpty}>
                <p>Create goal-oriented savings pots to manage your long-term milestones.</p>
                <Link href="/dashboard/savings" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Create Pot
                </Link>
              </div>
            ) : (
              user.savingsPots.slice(0, 3).map((pot) => {
                const percent = Math.min(Math.round((pot.currentBalance / pot.targetAmount) * 100), 100);
                return (
                  <div key={pot.id} className={styles.potRow}>
                    <div className={styles.potRowHeader}>
                      <span className={styles.potName}>{pot.name}</span>
                      <span className={styles.potValues}>
                        ₹{pot.currentBalance.toLocaleString()} / ₹{pot.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.potProgressContainer}>
                      <div 
                        className={styles.potProgressBar} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <div className={styles.potRowFooter}>
                      <span>{percent}% Completed</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Activity Feed Widget */}
        <ActivityFeed activities={mappedActivities} />

        {/* Platform Security Banner */}
        <div className={`${styles.securityBanner} glass-card`}>
          <ShieldCheck size={20} className={styles.securityIcon} />
          <div>
            <h4>Institutional Grade Security</h4>
            <p>Your connections and credentials are secure. Funds are fully simulated for educational SaaS display.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
