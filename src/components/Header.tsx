'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar, Menu } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import styles from './Header.module.css';

interface HeaderProps {
  user: {
    name: string;
    accountNo: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Overview';
      case '/dashboard/transfer':
        return 'Send & Receive';
      case '/dashboard/cards':
        return 'Virtual Cards';
      case '/dashboard/savings':
        return 'Savings Goals';
      case '/dashboard/history':
        return 'Transaction History';
      case '/dashboard/profile':
        return 'Profile Settings';
      case '/dashboard/insights':
        return 'AI Spending Analyst';
      default:
        return 'Dashboard';
    }
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) {
      document.getElementById('dashboard-sidebar')?.classList.toggle('mobile-sidebar-active');
    } else {
      document.getElementById('vortex-dashboard-root')?.classList.toggle('sidebar-collapsed');
    }
  };

  return (
    <header className={styles.header} id="dashboard-header">
      <div className={styles.titleArea}>
        <button 
          onClick={toggleSidebar} 
          className={styles.menuBtn} 
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1>{getPageTitle()}</h1>
          <p className={styles.greeting}>
            Welcome back, <span className={styles.highlight}>{user.name}</span>
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.dateBadge}>
          <Calendar size={16} />
          <span>{getFormattedDate()}</span>
        </div>

        <div className={styles.accountBadge} title="Your account status is fully verified.">
          <span className={styles.statusDot}></span>
          <span>Acc No: {user.accountNo}</span>
        </div>

        <ThemeToggle />
        <NotificationCenter />
      </div>
    </header>
  );
}
