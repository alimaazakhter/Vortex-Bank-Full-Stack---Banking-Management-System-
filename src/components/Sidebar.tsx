'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Landmark, LayoutDashboard, Send, CreditCard, PiggyBank, LogOut, User, History, X, ChevronLeft, PieChart } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
  user: {
    name: string;
    email: string;
    accountNo: string;
    avatarUrl?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/dashboard/transfer', icon: Send },
    { name: 'Virtual Cards', path: '/dashboard/cards', icon: CreditCard },
    { name: 'Savings Pots', path: '/dashboard/savings', icon: PiggyBank },
    { name: 'Budgets', path: '/dashboard/budgets', icon: PieChart },
    { name: 'Transaction History', path: '/dashboard/history', icon: History },
    { name: 'Profile', path: '/dashboard/profile', icon: User },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const isEmoji = (str: string) => {
    const charCode = str.codePointAt(0);
    return charCode ? charCode > 127 : false;
  };

  const closeSidebar = () => {
    document.getElementById('dashboard-sidebar')?.classList.remove('mobile-sidebar-active');
    document.getElementById('dashboard-sidebar-overlay')?.classList.remove('active');
  };

  const handleNavLinkClick = () => {
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  const handleCollapseClick = () => {
    document.getElementById('vortex-dashboard-root')?.classList.add('sidebar-collapsed');
  };

  return (
    <>
      <div 
        className={styles.sidebarOverlay} 
        id="dashboard-sidebar-overlay"
        onClick={closeSidebar} 
      />
      <aside className={`${styles.sidebar} glass-card`} id="dashboard-sidebar">
        <button onClick={closeSidebar} className={styles.closeBtn} aria-label="Close Menu">
          <X size={20} />
        </button>

      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <Landmark size={24} className={styles.iconPrimary} />
          </div>
          <span className={styles.logoText}>Vortex</span>
          <span className={styles.badge}>SaaS</span>
        </Link>
        
        <button 
          onClick={handleCollapseClick} 
          className={styles.collapseBtn}
          title="Hide Sidebar"
          aria-label="Hide Sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={handleNavLinkClick}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} className={styles.navIcon} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.profileSection}>
        <div className={styles.profileInfo}>
          <div className={`${styles.avatar} ${user.avatarUrl && !isEmoji(user.avatarUrl) ? styles.avatarHasImage : ''}`}>
            {user.avatarUrl ? (
              isEmoji(user.avatarUrl) ? (
                <span style={{ fontSize: '1.25rem' }}>{user.avatarUrl}</span>
              ) : (
                <img 
                  src={user.avatarUrl === 'preset_1' ? '/avatars/avatar-1.svg' : user.avatarUrl === 'preset_2' ? '/avatars/avatar-2.svg' : user.avatarUrl} 
                  alt="Avatar" 
                  className={styles.avatarImage} 
                />
              )
            ) : (
              getInitials(user.name)
            )}
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user.name}</p>
            <p className={styles.accountNo}>{user.accountNo}</p>
          </div>
        </div>
        
        <button onClick={handleLogout} className={styles.logoutBtn} title="Log Out">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  </>
  );
}
