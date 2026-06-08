'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, AlertCircle } from 'lucide-react';
import { showToast } from './Toast';
import styles from './NotificationCenter.module.css';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for dynamic live updates
    const interval = setInterval(fetchNotifications, 30000);
    
    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        showToast('Notification marked as read', 'info');
      }
    } catch (err) {
      showToast('Failed to update notification', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      showToast('Failed to update notifications', 'error');
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering any toggle read action
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        showToast('Notification deleted', 'info');
      }
    } catch (err) {
      showToast('Failed to delete notification', 'error');
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
    <div className={styles.container} ref={dropdownRef}>
      {/* Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={styles.bellBtn}
        title="View Notifications"
      >
        <Bell size={20} className={styles.bellIcon} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={`${styles.dropdown} glass-card animated-fade-in`}>
          <div className={styles.header}>
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
                <Check size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <Bell size={28} className={styles.emptyIcon} />
                <p>All quiet here! No new notifications.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                  className={`${styles.item} ${n.read ? '' : styles.unread}`}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemTop}>
                      <span className={styles.title}>{n.title}</span>
                      <span className={styles.time}>{getRelativeTime(n.createdAt)}</span>
                    </div>
                    <p className={styles.bodyText}>{n.content}</p>
                  </div>
                  
                  <div className={styles.itemActions}>
                    <button 
                      onClick={(e) => handleDelete(n.id, e)} 
                      className={styles.closeBtn}
                      title="Dismiss notification"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
