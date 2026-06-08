import React from 'react';
import { getCurrentUser } from '@/lib/session';
import SavingsManager from '@/components/SavingsManager';

import { db } from '@/lib/db';

export default async function SavingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch transactions to analyze savings streaks and velocity
  const transactions = await db.transaction.findMany({
    where: { 
      userId: user.id,
      type: { in: ['SAVINGS_CONTRIBUTION', 'SAVINGS_WITHDRAWAL'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  const plainTransactions = transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    createdAt: t.createdAt.toISOString(),
    description: t.description
  }));

  return (
    <div className="fade-in-only" style={{ padding: '20px 0' }}>
      <SavingsManager 
        initialPots={user.savingsPots} 
        walletBalance={user.balance} 
        transactions={plainTransactions}
      />
    </div>
  );
}
