'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Send, Key, DollarSign, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './TransactionForm.module.css';

interface TransactionFormProps {
  user: {
    name: string;
    balance: number;
    accountNo: string;
  };
  initialAction: 'deposit' | 'withdraw' | 'transfer';
}

export default function TransactionForm({ user, initialAction }: TransactionFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>(initialAction);
  
  // Form States
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [receiverAccountNo, setReceiverAccountNo] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [newBalance, setNewBalance] = useState<number | null>(null);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError('PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    if (activeTab === 'transfer' && !receiverAccountNo) {
      setError('Receiver account number is required');
      setLoading(false);
      return;
    }

    try {
      const endpoint = `/api/transaction/${activeTab}`;
      const payload: any = { amount: Number(amount), pin: Number(pin) };
      if (activeTab === 'transfer') {
        payload.receiverAccountNo = receiverAccountNo;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Transaction failed');
      } else {
        setSuccessMsg(data.message || 'Transaction executed successfully');
        setNewBalance(data.balance);
        setAmount('');
        setPin('');
        setReceiverAccountNo('');
        router.refresh();
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayBalance = newBalance !== null ? newBalance : user.balance;

  return (
    <div className={styles.container}>
      {/* Balance Summary Header */}
      <div className={`${styles.balanceHeader} glass-card`}>
        <div>
          <span className={styles.balanceLabel}>Account Capital Balance</span>
          <h2 className={styles.balanceVal}>
            ₹{currentDisplayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h2>
        </div>
        <div className={styles.accountNoLabel}>
          <span>Vortex Safe Account</span>
          <strong>{user.accountNo}</strong>
        </div>
      </div>

      <div className={styles.formCard}>
        {/* Navigation Tabs */}
        <div className={styles.tabsList}>
          <button 
            onClick={() => { setActiveTab('deposit'); setError(''); setSuccessMsg(''); }}
            className={`${styles.tabBtn} ${activeTab === 'deposit' ? styles.activeTab : ''}`}
            disabled={loading}
          >
            <Plus size={16} />
            <span>Deposit</span>
          </button>
          <button 
            onClick={() => { setActiveTab('withdraw'); setError(''); setSuccessMsg(''); }}
            className={`${styles.tabBtn} ${activeTab === 'withdraw' ? styles.activeTab : ''}`}
            disabled={loading}
          >
            <Minus size={16} />
            <span>Withdraw</span>
          </button>
          <button 
            onClick={() => { setActiveTab('transfer'); setError(''); setSuccessMsg(''); }}
            className={`${styles.tabBtn} ${activeTab === 'transfer' ? styles.activeTab : ''}`}
            disabled={loading}
          >
            <Send size={16} />
            <span>Transfer</span>
          </button>
        </div>

        {/* Transaction Success Screen */}
        {successMsg ? (
          <div className={`${styles.successScreen} animated-fade-in`}>
            <CheckCircle2 size={56} className={styles.successIcon} />
            <h3>Transaction Successful</h3>
            <p>{successMsg}</p>
            <div className={styles.successBalanceDetail}>
              <span>New Available Balance</span>
              <strong>₹{currentDisplayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <button 
              onClick={() => setSuccessMsg('')} 
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Transaction Forms */
          <form onSubmit={handleAction} className={styles.form}>
            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Transfer Recipient details */}
            {activeTab === 'transfer' && (
              <div className="input-group animated-fade-in">
                <label htmlFor="receiverAccountNo">Recipient Account Number</label>
                <div className={styles.inputWrapper}>
                  <UserCheck size={18} className={styles.fieldIcon} />
                  <input
                    id="receiverAccountNo"
                    type="text"
                    className="input-field"
                    placeholder="e.g. @1Ct9B8"
                    value={receiverAccountNo}
                    onChange={(e) => setReceiverAccountNo(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            )}

            {/* Amount */}
            <div className="input-group">
              <label htmlFor="amount">Amount (INR)</label>
              <div className={styles.inputWrapper}>
                <DollarSign size={18} className={styles.fieldIcon} />
                <input
                  id="amount"
                  type="number"
                  min="1"
                  max={activeTab === 'deposit' ? '10000' : '500000'}
                  className="input-field"
                  placeholder="₹ Amount to proceed"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              {activeTab === 'deposit' && (
                <span className={styles.helpText}>Maximum limit per deposit transaction is ₹10,000</span>
              )}
            </div>

            {/* Transaction PIN */}
            <div className="input-group">
              <label htmlFor="pin">4-Digit Security PIN</label>
              <div className={styles.inputWrapper}>
                <Key size={18} className={styles.fieldIcon} />
                <input
                  id="pin"
                  type="password"
                  maxLength={4}
                  className="input-field"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  required
                />
              </div>
              <span className={styles.helpText}>Enter your secret PIN to authorize this operation</span>
            </div>

            <button
              type="submit"
              className={`btn ${activeTab === 'withdraw' ? 'btn-danger' : 'btn-primary'}`}
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading}
            >
              {loading ? 'Processing Transaction...' : `Confirm ${activeTab.toUpperCase()}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
