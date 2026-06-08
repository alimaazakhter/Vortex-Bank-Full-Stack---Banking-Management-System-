'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Landmark, ArrowLeft, Key, Lock, User, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Forgot PIN recovery states
  const [useAccountDetails, setUseAccountDetails] = useState(false);
  const [accountNo, setAccountNo] = useState('');
  const [name, setName] = useState('');
  const [newPin, setNewPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !newPassword) {
      setError('Please fill in email and new password');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    let payload: any = {
      email,
      newPassword
    };

    if (useAccountDetails) {
      if (!accountNo || !name || !newPin) {
        setError('Please fill in all account verification fields');
        setLoading(false);
        return;
      }
      if (newPin.length !== 4 || isNaN(Number(newPin))) {
        setError('New PIN must be exactly 4 digits');
        setLoading(false);
        return;
      }
      payload.accountNo = accountNo;
      payload.name = name;
      payload.newPin = Number(newPin);
    } else {
      if (!pin) {
        setError('Please enter your 4-digit security PIN');
        setLoading(false);
        return;
      }
      if (pin.length !== 4 || isNaN(Number(pin))) {
        setError('PIN must be exactly 4 digits');
        setLoading(false);
        return;
      }
      payload.pin = Number(pin);
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset credentials');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to connect to server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={`${styles.card} glass-card animated-fade-in`}>
        {!success ? (
          <>
            <Link href="/login" className={styles.backLink}>
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>

            <div className={styles.logoSection}>
              <div className={styles.logoIcon}>
                <Landmark size={28} className={styles.iconPrimary} />
              </div>
              <h1>Vortex</h1>
              <p className={styles.subtitle}>
                {useAccountDetails ? 'Account Details Verification' : 'Simulated Password Recovery'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {/* Email Address */}
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.fieldIcon} />
                  <input
                    id="email"
                    type="email"
                    className="input-field"
                    placeholder="e.g. alimaaz1501@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {!useAccountDetails ? (
                /* Standard PIN Recovery Mode */
                <div className="input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="pin">4-Digit Security PIN</label>
                    <button
                      type="button"
                      onClick={() => {
                        setUseAccountDetails(true);
                        setError('');
                      }}
                      className={styles.link}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
                    >
                      Forgot PIN?
                    </button>
                  </div>
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
                  <span className={styles.helpText}>Enter the secret 4-digit PIN associated with your account.</span>
                </div>
              ) : (
                /* Advanced Account Details Recovery Mode */
                <>
                  {/* Account Number */}
                  <div className="input-group animated-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label htmlFor="accountNo">Vortex Account Number</label>
                      <button
                        type="button"
                        onClick={() => {
                          setUseAccountDetails(false);
                          setError('');
                        }}
                        className={styles.link}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}
                      >
                        Use PIN Recovery
                      </button>
                    </div>
                    <div className={styles.inputWrapper}>
                      <Landmark size={18} className={styles.fieldIcon} />
                      <input
                        id="accountNo"
                        type="text"
                        className="input-field"
                        placeholder="e.g. !l7kQ60 or @1Ct9B8"
                        value={accountNo}
                        onChange={(e) => setAccountNo(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <span className={styles.helpText}>Enter the unique alphanumeric account ID shown in your dashboard.</span>
                  </div>

                  {/* Registered Name */}
                  <div className="input-group animated-fade-in">
                    <label htmlFor="name">Registered Full Name</label>
                    <div className={styles.inputWrapper}>
                      <User size={18} className={styles.fieldIcon} />
                      <input
                        id="name"
                        type="text"
                        className="input-field"
                        placeholder="e.g. Alimaaz Akhter"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <span className={styles.helpText}>Must exactly match the name registered on the account.</span>
                  </div>

                  {/* New 4-Digit Security PIN */}
                  <div className="input-group animated-fade-in">
                    <label htmlFor="newPin">New 4-Digit Security PIN</label>
                    <div className={styles.inputWrapper}>
                      <Key size={18} className={styles.fieldIcon} />
                      <input
                        id="newPin"
                        type="password"
                        maxLength={4}
                        className="input-field"
                        placeholder="••••"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        disabled={loading}
                        required
                      />
                    </div>
                    <span className={styles.helpText}>Define a new secret 4-digit PIN for authorize transactions.</span>
                  </div>
                </>
              )}

              {/* New Password */}
              <div className="input-group">
                <label htmlFor="newPassword">New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.fieldIcon} />
                  <input
                    id="newPassword"
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
                <span className={styles.helpText}>Must be at least 6 characters long.</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Processing Reset...' : useAccountDetails ? 'Reset Password & PIN' : 'Reset Password'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successScreen}>
            <CheckCircle2 size={56} className={styles.successIcon} />
            <h2>Credentials Updated</h2>
            <p>
              {useAccountDetails 
                ? 'Your password and 4-digit transaction PIN have been successfully reset. You can now use your new credentials to sign in.' 
                : 'Your password has been successfully reset. You can now use your new password to sign in.'}
            </p>
            <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
              <span>Proceed to Sign In</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        {!success && (
          <div className={styles.footer}>
            <p>
              Remembered your password?{' '}
              <Link href="/login" className={styles.link}>
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
