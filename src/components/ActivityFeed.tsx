'use client';

import React from 'react';
import { PlusCircle, MinusCircle, Send, CreditCard, PiggyBank, Award } from 'lucide-react';
import styles from './ActivityFeed.module.css';

interface ActivityItem {
  id: number;
  type: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return <PlusCircle className={styles.iconDeposit} size={16} />;
      case 'WITHDRAWAL':
        return <MinusCircle className={styles.iconWithdraw} size={16} />;
      case 'TRANSFER':
        return <Send className={styles.iconTransfer} size={16} />;
      case 'CARD':
        return <CreditCard className={styles.iconCard} size={16} />;
      case 'SAVINGS':
        return <PiggyBank className={styles.iconSavings} size={16} />;
      default:
        return <Award className={styles.iconDefault} size={16} />;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHrs < 24) return `${diffHrs} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.feedCard}>
      <h3 className={styles.feedTitle}>Activity Feed</h3>
      
      <div className={styles.timeline}>
        {activities.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No recent activity logged.</p>
          </div>
        ) : (
          activities.slice(0, 5).map((item) => (
            <div key={item.id} className={styles.timelineItem}>
              <div className={styles.iconWrapper}>
                {getActivityIcon(item.type)}
              </div>
              <div className={styles.itemContent}>
                <p className={styles.itemTitle}>{item.title}</p>
                <p className={styles.itemDesc}>{item.content}</p>
                <span className={styles.itemTime}>{getRelativeTime(item.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
