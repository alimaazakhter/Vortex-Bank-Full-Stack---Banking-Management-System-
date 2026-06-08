'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Read theme from html data attribute on mount
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (currentTheme) {
      setTheme(currentTheme);
    }
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    // 1. Instantly update UI for optimistic responsive experience
    document.documentElement.classList.add('theme-transition');
    document.documentElement.setAttribute('data-theme', nextTheme);
    setTheme(nextTheme);
    
    // Save theme in cookie for both logged-in and logged-out views
    document.cookie = `vortex_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;

    // 2. Persist in database (will fail gracefully if logged out, saving to cookie is sufficient)
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themePreference: nextTheme.toUpperCase() }),
      });
    } catch (err) {
      console.error('Network error persisting theme preference', err);
    }
  };

  return (
    <button 
      onClick={toggleTheme} 
      className={styles.toggleBtn}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
    >
      {theme === 'dark' ? (
        <Sun size={20} className={styles.icon} />
      ) : (
        <Moon size={20} className={styles.icon} />
      )}
    </button>
  );
}
