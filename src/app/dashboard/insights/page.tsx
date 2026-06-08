import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import AIInsightsClient from '@/components/AIInsightsClient';

export default async function InsightsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Count active savings pots
  const savingsPotsCount = await db.savingsPot.count({
    where: { userId: user.id }
  });

  // Fetch all transactions for analysis
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  const serializableTransactions = transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    description: t.description,
    createdAt: t.createdAt.toISOString()
  }));

  // Fetch budgets
  const budgets = await db.budget.findMany({
    where: { userId: user.id }
  });

  const serializableBudgets = budgets.map(b => ({
    id: b.id,
    category: b.category,
    limit: b.limit
  }));

  return (
    <div className="animated-fade-in" style={{ padding: '20px 0' }}>
      <AIInsightsClient 
        transactions={serializableTransactions} 
        savingsPotsCount={savingsPotsCount}
        balance={user.balance}
        budgets={serializableBudgets}
      />
    </div>
  );
}
