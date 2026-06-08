import React from 'react';
import { getCurrentUser } from '@/lib/session';
import TransactionForm from '@/components/TransactionForm';

interface PageProps {
  searchParams: Promise<{
    action?: string;
  }>;
}

export default async function TransferPage({ searchParams }: PageProps) {
  // Fetch current authenticated user
  const user = await getCurrentUser();
  if (!user) return null;

  // Resolve query params
  const { action } = await searchParams;
  let initialAction: 'deposit' | 'withdraw' | 'transfer' = 'transfer';
  
  if (action === 'deposit' || action === 'withdraw' || action === 'transfer') {
    initialAction = action;
  }

  return (
    <div className="animated-fade-in" style={{ padding: '20px 0' }}>
      <TransactionForm 
        user={{ 
          name: user.name, 
          balance: user.balance, 
          accountNo: user.accountNo 
        }} 
        initialAction={initialAction} 
      />
    </div>
  );
}
