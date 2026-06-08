import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import TransactionHistoryClient from '@/components/TransactionHistoryClient';

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch all transactions for this user
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  // Convert Date objects to ISO strings for Client Component compatibility
  const serializableTransactions = transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    status: t.status,
    description: t.description,
    senderNo: t.senderNo,
    receiverNo: t.receiverNo,
    notes: t.notes,
    createdAt: t.createdAt.toISOString()
  }));

  return (
    <div className="animated-fade-in" style={{ padding: '20px 0' }}>
      <TransactionHistoryClient transactions={serializableTransactions} />
    </div>
  );
}
