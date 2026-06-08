import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './layout.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check auth session on server side
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className={styles.layoutContainer} id="vortex-dashboard-root">
      <Sidebar user={{ name: user.name, email: user.email, accountNo: user.accountNo, avatarUrl: user.avatarUrl }} />
      <div className={styles.mainContent}>
        <Header user={{ name: user.name, accountNo: user.accountNo }} />
        <main className={styles.scrollArea}>{children}</main>
      </div>
    </div>
  );
}
