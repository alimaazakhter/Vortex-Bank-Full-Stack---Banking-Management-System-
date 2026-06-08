'use client';

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Calendar,
  ArrowUpDown,
  BookOpen,
  Printer
} from 'lucide-react';
import styles from './TransactionHistoryClient.module.css';
import CustomSelect from './CustomSelect';

interface Transaction {
  id: number;
  amount: number;
  type: string;
  category: string;
  status: string;
  description: string;
  senderNo: string | null;
  receiverNo: string | null;
  notes: string | null;
  createdAt: string;
}

interface TransactionHistoryClientProps {
  transactions: Transaction[];
}

export default function TransactionHistoryClient({ transactions }: TransactionHistoryClientProps) {
  // Client state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DATE_DESC'); // DATE_DESC, DATE_ASC, AMOUNT_DESC, AMOUNT_ASC
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Available unique categories
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['ALL', ...Array.from(cats)];
  }, [transactions]);

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Search term filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.description.toLowerCase().includes(term) ||
        (t.notes && t.notes.toLowerCase().includes(term)) ||
        (t.senderNo && t.senderNo.toLowerCase().includes(term)) ||
        (t.receiverNo && t.receiverNo.toLowerCase().includes(term)) ||
        `TXN-${t.id.toString().padStart(6, '0')}`.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      result = result.filter(t => {
        if (typeFilter === 'DEPOSIT') return t.type === 'DEPOSIT';
        if (typeFilter === 'WITHDRAWAL') return t.type === 'WITHDRAWAL';
        if (typeFilter === 'TRANSFER_SENT') return t.type === 'TRANSFER_OUT';
        if (typeFilter === 'TRANSFER_RECEIVED') return t.type === 'TRANSFER_IN';
        if (typeFilter === 'SAVINGS_CONTRIBUTION') return t.type === 'SAVINGS_CONTRIBUTION';
        if (typeFilter === 'SAVINGS_WITHDRAWAL') return t.type === 'SAVINGS_WITHDRAWAL';
        return true;
      });
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      result = result.filter(t => t.category === categoryFilter);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(t => new Date(t.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.createdAt) <= end);
    }

    // Min/Max amount filter
    if (minAmount) {
      result = result.filter(t => t.amount >= Number(minAmount));
    }
    if (maxAmount) {
      result = result.filter(t => t.amount <= Number(maxAmount));
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'AMOUNT_DESC') {
        return b.amount - a.amount;
      }
      if (sortBy === 'AMOUNT_ASC') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, categoryFilter, startDate, endDate, sortBy, minAmount, maxAmount, statusFilter]);

  // Compute dynamic stats based on filtered transactions
  const stats = useMemo(() => {
    let deposits = 0;
    let withdrawals = 0;
    let transfers = 0;
    let savings = 0;

    filteredTransactions.forEach(t => {
      const isDep = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN';
      const isWith = t.type === 'WITHDRAWAL';
      const isTrans = t.type === 'TRANSFER_OUT';
      const isSave = t.type === 'SAVINGS_CONTRIBUTION';

      if (isDep) deposits += t.amount;
      else if (isWith) withdrawals += t.amount;
      else if (isTrans) transfers += t.amount;
      else if (isSave) savings += t.amount;
    });

    return { deposits, withdrawals, transfers, savings };
  }, [filteredTransactions]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, categoryFilter, startDate, endDate, sortBy, pageSize, minAmount, maxAmount, statusFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Handle CSV Export
  const handleExportCSV = () => {
    const headers = ["Transaction ID", "Type", "Category", "Amount (INR)", "Date", "Status", "Details", "Notes"];
    const rows = filteredTransactions.map(t => {
      const isPositive = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'SAVINGS_WITHDRAWAL';
      const formattedAmount = `${isPositive ? '+' : '-'}${t.amount}`;
      const details = t.type === 'TRANSFER_OUT' 
        ? `To: ${t.receiverNo}` 
        : t.type === 'TRANSFER_IN' 
        ? `From: ${t.senderNo}` 
        : t.description;
      return [
        `TXN-${t.id.toString().padStart(6, '0')}`,
        t.type,
        t.category,
        formattedAmount,
        new Date(t.createdAt).toLocaleString(),
        t.status,
        details,
        t.notes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vortex_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    const tableRows = filteredTransactions.map(t => {
      const isPositive = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'SAVINGS_WITHDRAWAL';
      return `
        <tr>
          <td><code>TXN-${t.id.toString().padStart(6, '0')}</code></td>
          <td>${t.type.replace(/_/g, ' ')}</td>
          <td>${t.category}</td>
          <td>${t.type === 'TRANSFER_OUT' ? `To: ${t.receiverNo}` : t.type === 'TRANSFER_IN' ? `From: ${t.senderNo}` : t.description}</td>
          <td>${new Date(t.createdAt).toLocaleDateString()}</td>
          <td>${t.status}</td>
          <td style="text-align: right; color: ${isPositive ? '#10b981' : '#ef4444'}; font-weight: bold;">
            ${isPositive ? '+' : '-'}₹${t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Vortex Bank Statement</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              color: #0f172a;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .brand h1 { margin: 0; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 0.05em; }
            .brand p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
            .meta { text-align: right; font-size: 14px; }
            .meta h2 { margin: 0 0 6px 0; font-size: 16px; color: #0f172a; }
            .meta p { margin: 2px 0; color: #64748b; }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
            }
            .summary-card span { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block; margin-bottom: 4px; }
            .summary-card strong { font-size: 18px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f1f5f9; font-weight: 600; text-align: left; font-size: 12px; color: #475569; padding: 12px; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              body { margin: 20px; }
              .summary-card { background: #f8fafc !important; -webkit-print-color-adjust: exact; }
              th { background: #f1f5f9 !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <h1>VORTEX SAAS BANK</h1>
              <p>Secure Premium Wealth Management Platform</p>
            </div>
            <div class="meta">
              <h2>ACCOUNT STATEMENT</h2>
              <p>Generated: ${dateStr}</p>
            </div>
          </div>
          <div class="summary-grid">
            <div class="summary-card">
              <span>Total Deposits</span>
              <strong>₹${stats.deposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div class="summary-card">
              <span>Total Withdrawals</span>
              <strong>₹${stats.withdrawals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div class="summary-card">
              <span>Total Transfers</span>
              <strong>₹${stats.transfers.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div class="summary-card">
              <span>Total Saved</span>
              <strong>₹${stats.savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Date</th>
                <th>Status</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows.length > 0 ? tableRows : '<tr><td colspan="7" style="text-align: center;">No transactions found.</td></tr>'}
            </tbody>
          </table>
          <div class="footer">
            <p>This is a system-generated statement and does not require a physical signature.</p>
            <p>Vortex Inc. © 2026. All rights reserved.</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return styles.badgeGreen;
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
        return styles.badgeRed;
      case 'SAVINGS_CONTRIBUTION':
      case 'SAVINGS_WITHDRAWAL':
        return styles.badgePurple;
      default:
        return styles.badgeBlue;
    }
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const getTransactionLabel = (t: Transaction) => {
    if (t.type === 'TRANSFER_OUT') return `To: ${t.receiverNo}`;
    if (t.type === 'TRANSFER_IN') return `From: ${t.senderNo}`;
    if (t.type === 'SAVINGS_CONTRIBUTION') return `Saved to Pot`;
    if (t.type === 'SAVINGS_WITHDRAWAL') return `Withdrew from Pot`;
    return t.description;
  };

  return (
    <div className={`${styles.container} animated-fade-in`}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Transaction History</h2>
          <p className={styles.subtitle}>View, search, filter and export your banking statements.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className={`${styles.exportBtn} btn btn-secondary`} onClick={handleDownloadPDF}>
            <Printer size={16} />
            <span>Download PDF</span>
          </button>
          <button className={`${styles.exportBtn} btn btn-secondary`} onClick={handleExportCSV}>
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className={styles.summaryGrid}>
        <div className={`${styles.summaryCard} glass-card`}>
          <span>Total Inflow</span>
          <strong>₹{stats.deposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className={`${styles.summaryCard} glass-card`}>
          <span>Total Debits</span>
          <strong>₹{stats.withdrawals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className={`${styles.summaryCard} glass-card`}>
          <span>Total Transfers</span>
          <strong>₹{stats.transfers.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <div className={`${styles.summaryCard} glass-card`}>
          <span>Total Saved</span>
          <strong>₹{stats.savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className={`${styles.filterCard} glass-card`}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by ID, desc, sender/receiver account or notes..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.filtersGrid}>
          {/* Type Filter */}
          <div className={styles.filterGroup}>
            <label>Transaction Type</label>
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'ALL', label: 'All Types' },
                { value: 'DEPOSIT', label: 'Deposits' },
                { value: 'WITHDRAWAL', label: 'Withdrawals' },
                { value: 'TRANSFER_SENT', label: 'Transfers Sent' },
                { value: 'TRANSFER_RECEIVED', label: 'Transfers Received' },
                { value: 'SAVINGS_CONTRIBUTION', label: 'Savings Pots Contributions' },
                { value: 'SAVINGS_WITHDRAWAL', label: 'Savings Pots Withdrawals' },
              ]}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.filterGroup}>
            <label>Category</label>
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories.map(cat => ({
                value: cat,
                label: cat === 'ALL' ? 'All Categories' : cat.replace(/_/g, ' ')
              }))}
            />
          </div>

          {/* Start Date */}
          <div className={styles.filterGroup}>
            <label>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.dateField}
            />
          </div>

          {/* End Date */}
          <div className={styles.filterGroup}>
            <label>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.dateField}
            />
          </div>

          {/* Min Amount */}
          <div className={styles.filterGroup}>
            <label>Min Amount (₹)</label>
            <input 
              type="number" 
              placeholder="Min"
              value={minAmount} 
              onChange={(e) => setMinAmount(e.target.value)}
              className={styles.dateField}
              style={{ padding: '8px 12px' }}
            />
          </div>

          {/* Max Amount */}
          <div className={styles.filterGroup}>
            <label>Max Amount (₹)</label>
            <input 
              type="number" 
              placeholder="Max"
              value={maxAmount} 
              onChange={(e) => setMaxAmount(e.target.value)}
              className={styles.dateField}
              style={{ padding: '8px 12px' }}
            />
          </div>

          {/* Status Filter */}
          <div className={styles.filterGroup}>
            <label>Status</label>
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'FAILED', label: 'Failed' },
              ]}
            />
          </div>

          {/* Sort By */}
          <div className={styles.filterGroup}>
            <label>Sort By</label>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'DATE_DESC', label: 'Date: Newest First' },
                { value: 'DATE_ASC', label: 'Date: Oldest First' },
                { value: 'AMOUNT_DESC', label: 'Amount: Highest First' },
                { value: 'AMOUNT_ASC', label: 'Amount: Lowest First' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Transactions Data Table */}
      <section className={`${styles.tableCard} glass-card`}>
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Category</th>
                <th>Details</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th className={styles.textRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                      <BookOpen size={48} className={styles.emptyIcon} />
                      <h3>No transactions found</h3>
                      <p>Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => {
                  const isPositive = t.type === 'DEPOSIT' || t.type === 'TRANSFER_IN' || t.type === 'SAVINGS_WITHDRAWAL';
                  const dateFormatted = new Date(t.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={t.id} className={styles.tableRow}>
                      <td className={styles.txnId}>
                        <code>TXN-{t.id.toString().padStart(6, '0')}</code>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getBadgeClass(t.type)}`}>
                          {formatType(t.type)}
                        </span>
                      </td>
                      <td>
                        <span className={styles.categoryTag}>
                          {t.category}
                        </span>
                      </td>
                      <td className={styles.detailsCell}>
                        {getTransactionLabel(t)}
                      </td>
                      <td className={styles.dateCell}>
                        {dateFormatted}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${t.status === 'SUCCESS' ? styles.statusSuccess : t.status === 'PENDING' ? styles.statusPending : styles.statusFailed}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className={styles.notesCell} title={t.notes || ''}>
                        {t.notes || <span className={styles.textMuted}>—</span>}
                      </td>
                      <td className={`${styles.amountCell} ${isPositive ? styles.amountPositive : styles.amountNegative}`}>
                        {isPositive ? '+' : '-'}₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <div className={styles.pageSizeRow}>
              <span>Show</span>
              <CustomSelect
                value={pageSize.toString()}
                onChange={(val) => setPageSize(Number(val))}
                options={[
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: '50', label: '50' },
                ]}
                style={{ width: '80px', margin: '0 8px' }}
              />
              <span>entries</span>
            </div>

            <div className={styles.pageIndicator}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredTransactions.length} entries)
            </div>

            <div className={styles.paginationButtons}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                disabled={currentPage === totalPages}
                className={styles.pageBtn}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
