/**
 * Storage Module
 * Handles persistence to localStorage, default data seeding, and CRUD operations.
 */

const STORAGE_KEY = 'kelola_uang_transactions';

// Default categories
export const CATEGORIES = {
  income: [
    { id: 'gaji', label: 'Gaji Pokok', icon: '💰' },
    { id: 'freelance', label: 'Freelance / Proyek', icon: '💻' },
    { id: 'investasi', label: 'Investasi / Dividen', icon: '📈' },
    { id: 'hadiah', label: 'Hadiah / Bonus', icon: '🎁' },
    { id: 'lainnya_in', label: 'Pemasukan Lainnya', icon: '✨' },
  ],
  expense: [
    { id: 'makan', label: 'Makanan & Minuman', icon: '🍔' },
    { id: 'transport', label: 'Transportasi & Bensin', icon: '🛵' },
    { id: 'tagihan', label: 'Listrik, Air & WiFi', icon: '⚡' },
    { id: 'belanja', label: 'Kebutuhan Harian', icon: '🛒' },
    { id: 'hiburan', label: 'Hiburan & Hobi', icon: '🎮' },
    { id: 'kesehatan', label: 'Kesehatan & Obat', icon: '💊' },
    { id: 'lainnya_ex', label: 'Pengeluaran Lainnya', icon: '📦' },
  ]
};

// Helper: local date string (avoids UTC off-by-one)
function localDateStr(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Initial dummy sample transactions for pleasant first experience
const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 5000000,
    description: 'Gaji Bulanan',
    category: 'gaji',
    date: localDateStr(3)
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 45000,
    description: 'Makan Siang Nasi Padang',
    category: 'makan',
    date: localDateStr(2)
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 150000,
    description: 'Bensin Motor Minggu Ini',
    category: 'transport',
    date: localDateStr(1)
  },
  {
    id: 'tx-4',
    type: 'income',
    amount: 750000,
    description: 'Project Web Desain Lepas',
    category: 'freelance',
    date: localDateStr(0)
  }
];

export function getTransactions() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    saveTransactions(INITIAL_TRANSACTIONS);
    return INITIAL_TRANSACTIONS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse transactions', e);
    return [];
  }
}

export function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction) {
  const transactions = getTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);
  return transactions;
}

export function deleteTransaction(id) {
  const transactions = getTransactions();
  const filtered = transactions.filter(tx => tx.id !== id);
  saveTransactions(filtered);
  return filtered;
}

export function deleteTransactionsByIds(ids) {
  const idSet = new Set(ids);
  const transactions = getTransactions();
  const filtered = transactions.filter(tx => !idSet.has(tx.id));
  saveTransactions(filtered);
  return filtered;
}
