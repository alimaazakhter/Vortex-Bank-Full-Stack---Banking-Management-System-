'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, EyeOff, ShieldCheck, Lock, Unlock, Trash2, CreditCard } from 'lucide-react';
import { formatCardNumber } from '@/lib/utils';
import styles from './CardsManager.module.css';
import CustomSelect from './CustomSelect';

interface Card {
  id: number;
  cardNumber: string;
  expiry: string;
  cvv: string;
  status: string;
  nickname?: string | null;
  spendingLimit: number;
  createdAt: string;
}

interface CardsManagerProps {
  initialCards: Card[];
  userName: string;
  transactions: any[];
  walletBalance: number;
}

export default function CardsManager({ initialCards, userName, transactions, walletBalance }: CardsManagerProps) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(
    initialCards.length > 0 ? initialCards[0].id : null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Flip states: keeps track of which cards are showing the CVV (flipped)
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  
  // Toggle mask state: show/hide full card numbers
  const [showNumbers, setShowNumbers] = useState<Record<number, boolean>>({});

  // Control inputs for the selected card
  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0] || null;
  const [nicknameInput, setNicknameInput] = useState('');
  const [limitInput, setLimitInput] = useState(10000);
  const [savingControls, setSavingControls] = useState(false);

  // Simulate modal states
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState('');
  const [simulateCategory, setSimulateCategory] = useState('SHOPPING');
  const [simulateDescription, setSimulateDescription] = useState('');
  const [simulating, setSimulating] = useState(false);

  // Sync inputs when selected card changes
  React.useEffect(() => {
    if (selectedCard) {
      setNicknameInput(selectedCard.nickname || '');
      setLimitInput(selectedCard.spendingLimit ?? 10000);
    }
  }, [selectedCardId, selectedCard]);

  const handleCreateCard = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/cards/create', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create card');
      } else {
        setCards([...cards, data.card]);
        setSelectedCardId(data.card.id);
        setSuccess('New virtual card created successfully!');
        router.refresh();
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection changes or flips
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/cards/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to toggle card status');
      } else {
        setCards(cards.map(c => c.id === cardId ? data.card : c));
        setSuccess(`Card status successfully updated to ${data.card.status}`);
        router.refresh();
      }
    } catch (err) {
      setError('Failed to update card status.');
    }
  };

  const handleDeleteCard = async (cardId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to terminate this virtual card? This action is irreversible.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/cards/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to terminate card');
      } else {
        const remaining = cards.filter(c => c.id !== cardId);
        setCards(remaining);
        if (selectedCardId === cardId) {
          setSelectedCardId(remaining.length > 0 ? remaining[0].id : null);
        }
        setSuccess('Virtual card terminated successfully.');
        router.refresh();
      }
    } catch (err) {
      setError('Failed to terminate card.');
    }
  };

  const handleUpdateControls = async () => {
    if (!selectedCard) return;
    setError('');
    setSuccess('');
    setSavingControls(true);

    try {
      const res = await fetch('/api/cards/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: selectedCard.id,
          nickname: nicknameInput,
          spendingLimit: limitInput
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update card controls');
      } else {
        setCards(cards.map(c => c.id === selectedCard.id ? data.card : c));
        setSuccess('Card limits and controls updated successfully.');
        router.refresh();
      }
    } catch (err) {
      setError('Failed to save controls.');
    } finally {
      setSavingControls(false);
    }
  };

  const handleSimulatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    setError('');
    setSuccess('');
    setSimulating(true);

    try {
      const res = await fetch('/api/cards/simulate-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: selectedCard.id,
          amount: Number(simulateAmount),
          category: simulateCategory,
          description: simulateDescription
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Simulated transaction declined');
        setIsSimulateModalOpen(false);
      } else {
        setSuccess(`Successfully simulated purchase of ₹${Number(simulateAmount).toLocaleString()} at ${simulateDescription}`);
        setIsSimulateModalOpen(false);
        setSimulateAmount('');
        setSimulateDescription('');
        // Refresh local stats immediately via page refresh
        router.refresh();
      }
    } catch (err) {
      setError('Transaction simulation failed.');
      setIsSimulateModalOpen(false);
    } finally {
      setSimulating(false);
    }
  };

  const toggleFlip = (id: number, e: React.MouseEvent) => {
    // DO NOT stop propagation so the card can still be selected by the container onClick
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleShowNumber = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card flipping
    setSelectedCardId(id); // Select the card explicitly since we stopped propagation
    setShowNumbers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Predefined aesthetic gradients for cards
  const gradients = [
    'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', // Indigo Deep Slate
    'linear-gradient(135deg, #064e3b 0%, #022c22 100%)', // Deep Emerald
    'linear-gradient(135deg, #4c1d95 0%, #2e1065 100%)', // Royal Purple
  ];

  // Selected card specifics
  const cardTransactions = selectedCard ? transactions.filter(t => t.cardId === selectedCard.id) : [];
  const totalSpentOnCard = cardTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Month-to-date spending on card
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCardSpent = cardTransactions
    .filter(t => new Date(t.createdAt) >= startOfMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Safe spending limit with fallback
  const safeSpendingLimit = selectedCard?.spendingLimit ?? 10000;

  const cardLastUsed = cardTransactions.length > 0
    ? new Date(Math.max(...cardTransactions.map(t => new Date(t.createdAt).getTime()))).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Never used';

  // Category breakdown for selected card
  const categorySpent: Record<string, number> = {
    SHOPPING: 0,
    FOOD: 0,
    TRAVEL: 0,
    ENTERTAINMENT: 0,
    BILLS: 0,
    HEALTHCARE: 0,
  };
  cardTransactions.forEach(t => {
    const catName = (t.category || '').toUpperCase();
    if (categorySpent[catName] !== undefined) {
      categorySpent[catName] += t.amount;
    }
  });

  return (
    <div className={styles.managerContainer}>
      <div className={styles.headerRow}>
        <div>
          <h2>Virtual Debit Cards</h2>
          <p className={styles.sub}>Instant, secure cards for all your online payments</p>
        </div>
        
        <button 
          onClick={handleCreateCard} 
          className="btn btn-primary"
          disabled={loading || cards.length >= 3}
        >
          <Plus size={16} />
          <span>{loading ? 'Generating...' : 'Generate New Card'}</span>
        </button>
      </div>

      {error && <div className={styles.alertBoxError}>{error}</div>}
      {success && <div className={styles.alertBoxSuccess}>{success}</div>}

      {cards.length === 0 ? (
        <div className={`${styles.emptyState} glass-card`}>
          <CreditCard size={48} className={styles.emptyIcon} />
          <h3>No Virtual Cards</h3>
          <p>Create a virtual card in seconds to start shopping online securely. You can lock or delete it at any time.</p>
          <button onClick={handleCreateCard} className="btn btn-primary" disabled={loading}>
            Create Card
          </button>
        </div>
      ) : (
        <>
          <div className={styles.cardsGrid}>
            {cards.map((card, idx) => {
              const isFlipped = !!flippedCards[card.id];
              const isShowingNum = !!showNumbers[card.id];
              const isFrozen = card.status === 'FROZEN';
              const isSelected = card.id === selectedCardId;
              const cardGrad = gradients[idx % gradients.length];

              return (
                <div 
                  key={card.id} 
                  className={`${styles.cardContainer} ${isSelected ? styles.cardActive : ''}`}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  {/* 3D Flip Card */}
                  <div 
                    onClick={(e) => toggleFlip(card.id, e)}
                    className={`${styles.card3D} ${isFlipped ? styles.flipped : ''} ${isFrozen ? styles.frozen : ''}`}
                    style={{ background: cardGrad }}
                  >
                    {/* FRONT FACE */}
                    <div className={styles.cardFront}>
                      <div className={styles.cardTop}>
                        <div>
                          <span className={styles.cardType}>{card.nickname || 'Virtual Debit'}</span>
                          <p className={styles.bankName}>VORTEX SAFE</p>
                        </div>
                        <span className={styles.cardNetwork}>
                          {card.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard'}
                        </span>
                      </div>

                      <div className={styles.cardMiddle}>
                        <span className={styles.cardNumberText}>
                          {isShowingNum 
                            ? formatCardNumber(card.cardNumber)
                            : `•••• •••• •••• ${card.cardNumber.slice(-4)}`
                          }
                        </span>
                        <button 
                          onClick={(e) => toggleShowNumber(card.id, e)}
                          className={styles.eyeBtn}
                          title={isShowingNum ? 'Hide card number' : 'Show card number'}
                        >
                          {isShowingNum ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      <div className={styles.cardBottom}>
                        <div>
                          <span className={styles.cardLabel}>Card Holder</span>
                          <p className={styles.cardValue}>{userName}</p>
                        </div>
                        <div>
                          <span className={styles.cardLabel}>Expiry</span>
                          <p className={styles.cardValue}>{card.expiry}</p>
                        </div>
                      </div>

                      {isFrozen && (
                        <div className={styles.frozenBanner}>
                          <Lock size={16} />
                          <span>FROZEN</span>
                        </div>
                      )}
                    </div>

                    {/* BACK FACE */}
                    <div className={styles.cardBack}>
                      <div className={styles.magStrip}></div>
                      <div className={styles.signatureRow}>
                        <div className={styles.sigArea}>
                          <span>Authorized Signature</span>
                        </div>
                        <div className={styles.cvvArea}>
                          <span className={styles.cvvLabel}>CVV</span>
                          <span className={styles.cvvValue}>{card.cvv}</span>
                        </div>
                      </div>
                      <div className={styles.cardBackFooter}>
                        <p className={styles.disclaimer}>
                          This virtual card is completely secure. Click card to flip back.
                        </p>
                        <span className={styles.shieldIcon}><ShieldCheck size={16} /></span>
                      </div>
                    </div>
                  </div>

                  {/* CARD QUICK CONTROLS */}
                  <div className={styles.cardControls}>
                    <button 
                      onClick={(e) => handleToggleFreeze(card.id, e)}
                      className={`${styles.controlBtn} btn btn-secondary`}
                      title={isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
                    >
                      {isFrozen ? <Unlock size={16} /> : <Lock size={16} />}
                      <span>{isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                    </button>
                    <button 
                      onClick={(e) => handleDeleteCard(card.id, e)}
                      className={`${styles.controlBtn} ${styles.btnDelete} btn btn-secondary`}
                      title="Terminate Card"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ADVANCED DETAIL PANEL FOR THE SELECTED CARD */}
          {selectedCard && (
            <div className={`${styles.detailPanel} glass-card animated-fade-in`}>
              <div className={styles.panelHeader}>
                <div>
                  <h3 className={styles.panelTitle}>
                    Manage: {selectedCard.nickname || `Card •••• ${selectedCard.cardNumber.slice(-4)}`}
                  </h3>
                  <p className={styles.panelSub}>Customize limits, simulate transactions, and view activity</p>
                </div>
                <button 
                  onClick={() => setIsSimulateModalOpen(true)}
                  className="btn btn-primary"
                  disabled={selectedCard.status === 'FROZEN'}
                  style={{ gap: '8px' }}
                >
                  <CreditCard size={16} />
                  <span>Simulate Purchase</span>
                </button>
              </div>

              <div className={styles.panelLayout}>
                {/* COLUMN 1: CONTROLS & META */}
                <div className={styles.panelCol}>
                  <div className={styles.controlBox}>
                    <h4>Card Identity & Limits</h4>
                    
                    <div className={styles.inputGroup}>
                      <label>Nickname</label>
                      <input 
                        type="text" 
                        value={nicknameInput}
                        onChange={(e) => setNicknameInput(e.target.value)}
                        placeholder="e.g. Subscriptions, Shopping"
                        className="form-control"
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <div className={styles.limitLabelRow}>
                        <label>Monthly Spending Limit</label>
                        <strong className={styles.limitValue}>₹{(limitInput ?? 0).toLocaleString()}</strong>
                      </div>
                      <input 
                        type="range"
                        min="1000"
                        max="200000"
                        step="1000"
                        value={limitInput}
                        onChange={(e) => setLimitInput(Number(e.target.value))}
                        className={styles.limitSlider}
                      />
                      <div className={styles.sliderTicks}>
                        <span>₹1,000</span>
                        <span>₹100,000</span>
                        <span>₹200,000</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleUpdateControls}
                      className="btn btn-secondary"
                      disabled={savingControls}
                      style={{ width: '100%', marginTop: '8px' }}
                    >
                      {savingControls ? 'Saving Controls...' : 'Save Settings'}
                    </button>
                  </div>

                  <div className={styles.metaBox}>
                    <h4>Card Information</h4>
                    <div className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <span>Created On</span>
                        <strong>{new Date(selectedCard.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Last Used</span>
                        <strong>{cardLastUsed}</strong>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Total Transactions</span>
                        <strong>{cardTransactions.length} payments</strong>
                      </div>
                      <div className={styles.metaItem}>
                        <span>Monthly Spending</span>
                        <strong>₹{monthlyCardSpent.toLocaleString()} / ₹{safeSpendingLimit.toLocaleString()}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: ANALYTICS & TIMELINE */}
                <div className={styles.panelCol}>
                  <div className={styles.analyticsBox}>
                    <h4>Spending Breakdown</h4>
                    {totalSpentOnCard === 0 ? (
                      <p className={styles.noData}>No spending recorded on this card yet.</p>
                    ) : (
                      <div className={styles.categoryStats}>
                        {Object.entries(categorySpent).map(([cat, amount]) => {
                          const percentage = totalSpentOnCard > 0 ? (amount / totalSpentOnCard) * 100 : 0;
                          return (
                            <div key={cat} className={styles.catStatRow}>
                              <div className={styles.catStatHeader}>
                                <span>{cat}</span>
                                <strong>₹{amount.toLocaleString()} ({percentage.toFixed(0)}%)</strong>
                              </div>
                              <div className={styles.catProgressBarBg}>
                                <div 
                                  className={styles.catProgressBarFill} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className={styles.timelineBox}>
                    <h4>Card Activity Timeline</h4>
                    {cardTransactions.length === 0 ? (
                      <p className={styles.noData}>No transaction logs exist for this card.</p>
                    ) : (
                      <div className={styles.timelineList}>
                        {cardTransactions.slice(0, 5).map((t) => (
                          <div key={t.id} className={styles.timelineItem}>
                            <div className={styles.timelineDot}></div>
                            <div className={styles.timelineContent}>
                              <div className={styles.timelineHeader}>
                                <strong>{t.description}</strong>
                                <span className={styles.timelineAmount}>-₹{t.amount.toLocaleString()}</span>
                              </div>
                              <div className={styles.timelineMeta}>
                                <span>{t.category}</span>
                                <span>•</span>
                                <span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATE PURCHASE MODAL */}
          {isSimulateModalOpen && selectedCard && (
            <div className={styles.modalOverlay} onClick={() => setIsSimulateModalOpen(false)}>
              <div className={`${styles.modalContent} glass-card animated-scale-up`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3>Simulate Store Checkout</h3>
                  <p>Test your virtual card's spending limit and budget safety guards</p>
                </div>
                <form onSubmit={handleSimulatePurchase} className={styles.modalForm}>
                  <div className={styles.inputGroup}>
                    <label>Purchase Amount (INR)</label>
                    <input 
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 500"
                      value={simulateAmount}
                      onChange={(e) => setSimulateAmount(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Store Category</label>
                    <CustomSelect
                      value={simulateCategory}
                      onChange={(val) => setSimulateCategory(val)}
                      options={[
                        { value: 'SHOPPING', label: 'Shopping' },
                        { value: 'FOOD', label: 'Food & Dining' },
                        { value: 'TRAVEL', label: 'Travel & Transport' },
                        { value: 'ENTERTAINMENT', label: 'Entertainment' },
                        { value: 'BILLS', label: 'Bills & Utilities' },
                        { value: 'HEALTHCARE', label: 'Healthcare' },
                      ]}
                      placeholder="Select category"
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Merchant / Description</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Amazon, Starbucks, Netflix"
                      value={simulateDescription}
                      onChange={(e) => setSimulateDescription(e.target.value)}
                      className="form-control"
                    />
                  </div>

                  <div className={styles.modalMetaInfo}>
                    <p>Current Card: <strong>{selectedCard.nickname || `•••• ${selectedCard.cardNumber.slice(-4)}`}</strong></p>
                    <p>Available Limit: <strong>₹{(safeSpendingLimit - monthlyCardSpent).toLocaleString()}</strong></p>
                    <p>Your Wallet Balance: <strong>₹{walletBalance.toLocaleString()}</strong></p>
                  </div>

                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      onClick={() => setIsSimulateModalOpen(false)}
                      className="btn btn-secondary"
                      disabled={simulating}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={simulating}
                    >
                      {simulating ? 'Processing Payment...' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
