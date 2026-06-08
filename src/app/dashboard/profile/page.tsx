import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import UserProfileClient from '@/components/UserProfileClient';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Count active cards and savings pots for this user
  const cardsCount = await db.virtualCard.count({
    where: { userId: user.id }
  });

  const savingsPotsCount = await db.savingsPot.count({
    where: { userId: user.id }
  });

  const serializableUser = {
    name: user.name,
    email: user.email,
    accountNo: user.accountNo,
    joinDate: user.joinDate.toISOString(),
    avatarUrl: user.avatarUrl,
    themePreference: user.themePreference,
    notificationPreference: user.notificationPreference,
    balance: user.balance,
    cardsCount,
    savingsPotsCount
  };

  return (
    <div className="animated-fade-in" style={{ padding: '20px 0' }}>
      <UserProfileClient user={serializableUser} />
    </div>
  );
}
