import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import BudgetsManager from '@/components/BudgetsManager';

export default async function BudgetsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // 1. Fetch configured budgets
  const budgets = await db.budget.findMany({
    where: { userId: user.id }
  });

  // 2. Fetch current month's expenses for progress calculation
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const currentMonthTransactions = await db.transaction.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: startOfMonth }
    }
  });

  // Convert schema budgets into plain objects
  const plainBudgets = budgets.map(b => ({
    id: b.id,
    category: b.category,
    limit: b.limit,
    userId: b.userId,
    createdAt: b.createdAt.toISOString()
  }));

  // Convert transactions into plain objects
  const plainTransactions = currentMonthTransactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    createdAt: t.createdAt.toISOString()
  }));

  return (
    <div className="animated-fade-in" style={{ padding: '20px 0' }}>
      <BudgetsManager 
        initialBudgets={plainBudgets}
        currentMonthTransactions={plainTransactions}
        walletBalance={user.balance}
      />
    </div>
  );
}
