/**
 * UI Controller and Rendering Module
 */

import { formatRupiah, formatFriendlyDate } from './utils.js';
import { CATEGORIES } from './storage.js';

export function updateStats(transactions, mode) {
  let income = 0;
  let expense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  transactions.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === 'income') {
      income += amt;
      incomeCount++;
    } else {
      expense += amt;
      expenseCount++;
    }
  });

  const balance = income - expense;

  const elBalance = document.getElementById('totalBalance');
  const elIncome = document.getElementById('totalIncome');
  const elExpense = document.getElementById('totalExpense');

  const elIncomeCount = document.getElementById('incomeCount');
  const elExpenseCount = document.getElementById('expenseCount');
  const elBalanceSub = document.getElementById('balanceSubtext');

  if (elBalance) elBalance.textContent = formatRupiah(balance);
  if (elIncome) elIncome.textContent = formatRupiah(income);
  if (elExpense) elExpense.textContent = formatRupiah(expense);

  if (elIncomeCount) elIncomeCount.textContent = `${incomeCount} transaksi masuk`;
  if (elExpenseCount) elExpenseCount.textContent = `${expenseCount} transaksi keluar`;
  if (elBalanceSub) {
    elBalanceSub.textContent = mode === 'weekly' ? 'Saldo periode minggu ini' : 'Akumulasi seluruh transaksi';
  }
}

export function renderTransactionsList(transactions, onDeleteCallback) {
  const container = document.getElementById('transactionsList');
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📂</div>
        <p>Belum ada catatan transaksi pada tampilan ini.</p>
        <span style="font-size: 0.8rem; color: var(--text-sub);">Klik tombol "+ Tambah Transaksi" untuk memulai.</span>
      </div>
    `;
    return;
  }

  // Find category icon & label
  const allCategories = [...CATEGORIES.income, ...CATEGORIES.expense];
  const catMap = {};
  allCategories.forEach(c => {
    catMap[c.id] = c;
  });

  container.innerHTML = transactions.map(tx => {
    const isIncome = tx.type === 'income';
    const cat = catMap[tx.category] || { label: tx.category, icon: isIncome ? '📥' : '📤' };
    const sign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';
    const iconClass = isIncome ? 'tx-icon-income' : 'tx-icon-expense';

    return `
      <div class="tx-item" data-id="${tx.id}">
        <div class="tx-left">
          <div class="tx-icon-circle ${iconClass}">
            ${cat.icon}
          </div>
          <div class="tx-info">
            <span class="tx-desc">${escapeHtml(tx.description)}</span>
            <div class="tx-meta">
              <span class="tx-tag">${escapeHtml(cat.label)}</span>
              <span>•</span>
              <span>${formatFriendlyDate(tx.date)}</span>
            </div>
          </div>
        </div>

        <div class="tx-right">
          <div class="tx-amount ${amountClass}">
            ${sign} ${formatRupiah(tx.amount)}
          </div>
          <button class="btn-delete-tx" data-id="${tx.id}" title="Hapus Transaksi">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach delete handlers
  const deleteButtons = container.querySelectorAll('.btn-delete-tx');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      if (confirm('Yakin ingin menghapus transaksi ini?')) {
        onDeleteCallback(id);
      }
    });
  });
}

export function populateCategoryDropdown(type) {
  const catSelect = document.getElementById('txCategory');
  const filterCat = document.getElementById('filterCategory');
  if (!catSelect) return;

  const categories = CATEGORIES[type] || [];
  catSelect.innerHTML = categories.map(c => 
    `<option value="${c.id}">${c.icon} ${c.label}</option>`
  ).join('');

  if (filterCat) {
    const all = [...CATEGORIES.income, ...CATEGORIES.expense];
    const unique = [];
    const seen = new Set();
    all.forEach(c => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        unique.push(c);
      }
    });
    const currentVal = filterCat.value;
    filterCat.innerHTML = `<option value="all">Semua Kategori</option>` +
      unique.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('');
    filterCat.value = currentVal;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
