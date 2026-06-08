import React from 'react';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import CardsManager from '@/components/CardsManager';

export default async function CardsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Fetch all transactions to dynamically calculate card timelines and budgets
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  const plainTransactions = transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    status: t.status,
    description: t.description,
    cardId: t.cardId,
    createdAt: t.createdAt.toISOString()
  }));

  const plainCards = user.cards.map(c => ({
    id: c.id,
    cardNumber: c.cardNumber,
    expiry: c.expiry,
    cvv: c.cvv,
    status: c.status,
    nickname: c.nickname,
    spendingLimit: c.spendingLimit,
    createdAt: c.createdAt.toISOString()
  }));

  return (
    <div className="animated-fade-in" style={{ padding: '20px 0' }}>
      <CardsManager 
        initialCards={plainCards} 
        userName={user.name} 
        transactions={plainTransactions}
        walletBalance={user.balance}
      />
    </div>
  );
}
