'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowRight, Lock, User, Mail, Calendar, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [age, setAge] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password || !pin || !age) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setError('You must be 18 or older to create a bank account');
      setLoading(false);
      return;
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setError('PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, pin: Number(pin), age: ageNum }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push('/dashboard');
        router.refresh();
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
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <Landmark size={28} className={styles.iconPrimary} />
          </div>
          <h1>Create Account</h1>
          <p className={styles.subtitle}>Start your premium digital banking journey</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.fieldIcon} />
              <input
                id="name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.fieldIcon} />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className="input-group" style={{ flex: 1 }}>
              <label htmlFor="age">Age</label>
              <div className={styles.inputWrapper}>
                <Calendar size={18} className={styles.fieldIcon} />
                <input
                  id="age"
                  type="number"
                  min="18"
                  max="120"
                  className="input-field"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ flex: 1 }}>
              <label htmlFor="pin">4-Digit PIN</label>
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
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.fieldIcon} />
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register Now'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            Already have an account?{' '}
            <Link href="/login" className={styles.link}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
