/**
 * App Main Controller
 * Connects Storage, UI, Utils, and Charts.
 */

import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  deleteTransactionsByIds
} from './storage.js';

import {
  getCurrentWeekRange,
  formatWeekRangeDisplay,
  isDateWithinRange,
  getWeekOfMonth,
  getDayOfWeek,
  extractYears
} from './utils.js';

import {
  updateStats,
  renderTransactionsList,
  populateCategoryDropdown
} from './ui.js';

import { renderCharts } from './charts.js';

// Application State
let currentMode = 'weekly'; // 'weekly' or 'all'
let filterSearch = '';
let filterType = 'all';
let filterCategory = 'all';
// Advanced date filters (active only in 'all' mode)
let filterYear = 'all';
let filterMonth = 'all';
let filterWeekOfMonth = 'all';
let filterDayOfWeek = 'all';

/**
 * Returns today's date as 'YYYY-MM-DD' string in LOCAL timezone (avoids UTC off-by-one)
 */
function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Reset all list filters to their default (all) state.
 * Called when switching between weekly/all modes.
 */
function resetFilters() {
  filterSearch = '';
  filterType = 'all';
  filterCategory = 'all';
  const searchInput = document.getElementById('filterSearch');
  const typeSelect = document.getElementById('filterType');
  const catSelect = document.getElementById('filterCategory');
  if (searchInput) searchInput.value = '';
  if (typeSelect) typeSelect.value = 'all';
  if (catSelect) catSelect.value = 'all';
  resetDateFilters();
}

/**
 * Reset only the advanced date filter controls and their state.
 */
function resetDateFilters() {
  filterYear = 'all';
  filterMonth = 'all';
  filterWeekOfMonth = 'all';
  filterDayOfWeek = 'all';
  const yearSel = document.getElementById('filterYear');
  const monthSel = document.getElementById('filterMonth');
  const weekSel = document.getElementById('filterWeekOfMonth');
  const daySel = document.getElementById('filterDayOfWeek');
  if (yearSel) yearSel.value = 'all';
  if (monthSel) monthSel.value = 'all';
  if (weekSel) weekSel.value = 'all';
  if (daySel) daySel.value = 'all';
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  setupEventListeners();
  populateCategoryDropdown('income');
  // Set default date input to today (local timezone)
  const dateInput = document.getElementById('txDate');
  if (dateInput) {
    dateInput.value = getLocalDateString();
  }
  refreshView();
}

function setupEventListeners() {
  // Mode switcher
  const btnWeekly = document.getElementById('btnModeWeekly');
  const btnAll = document.getElementById('btnModeAll');

  btnWeekly.addEventListener('click', () => {
    if (currentMode === 'weekly') return;
    currentMode = 'weekly';
    btnWeekly.classList.add('active');
    btnWeekly.setAttribute('aria-selected', 'true');
    btnAll.classList.remove('active');
    btnAll.setAttribute('aria-selected', 'false');
    resetFilters();
    refreshView();
  });

  btnAll.addEventListener('click', () => {
    if (currentMode === 'all') return;
    currentMode = 'all';
    btnAll.classList.add('active');
    btnAll.setAttribute('aria-selected', 'true');
    btnWeekly.classList.remove('active');
    btnWeekly.setAttribute('aria-selected', 'false');
    resetFilters();
    refreshView();
  });

  // Modal interactions
  const modal = document.getElementById('transactionModal');
  const btnOpenModal = document.getElementById('btnOpenModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const txForm = document.getElementById('transactionForm');

  const openModal = () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('txAmount').focus();
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    txForm.reset();
    populateCategoryDropdown('income');
    document.getElementById('txDate').value = getLocalDateString();
  };

  btnOpenModal.addEventListener('click', openModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);

  // Close modal when clicking outside box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Radio button type switch in form
  const typeRadios = document.querySelectorAll('input[name="txType"]');
  typeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      populateCategoryDropdown(e.target.value);
    });
  });

  // Form submit
  txForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="txType"]:checked').value;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const description = document.getElementById('txDescription').value.trim();
    const category = document.getElementById('txCategory').value;
    const date = document.getElementById('txDate').value;

    if (!amount || amount <= 0 || !description || !date) {
      alert('Harap isi semua kolom dengan benar!');
      return;
    }

    const newTx = {
      id: 'tx-' + Date.now(),
      type,
      amount,
      description,
      category,
      date
    };

    addTransaction(newTx);
    closeModal();
    refreshView();
  });

  // Reset weekly button
  const btnReset = document.getElementById('btnResetWeeklyData');
  btnReset.addEventListener('click', () => {
    const week = getCurrentWeekRange();
    const allTx = getTransactions();
    const currentWeekTx = allTx.filter(t => isDateWithinRange(t.date, week.startStr, week.endStr));

    if (currentWeekTx.length === 0) {
      alert('Tidak ada transaksi di minggu ini yang perlu di-reset.');
      return;
    }

    const confirmReset = confirm(
      `Perhatian: Kamu akan mereset ${currentWeekTx.length} transaksi di minggu ini.\nData minggu ini akan dihapus. Lanjutkan?`
    );

    if (confirmReset) {
      const idsToDelete = currentWeekTx.map(t => t.id);
      deleteTransactionsByIds(idsToDelete);
      refreshView();
    }
  });

  // Search & Filter controls
  const searchInput = document.getElementById('filterSearch');
  const typeSelect = document.getElementById('filterType');
  const catSelect = document.getElementById('filterCategory');

  searchInput.addEventListener('input', (e) => {
    filterSearch = e.target.value.toLowerCase();
    renderFilteredTransactions();
  });

  typeSelect.addEventListener('change', (e) => {
    filterType = e.target.value;
    renderFilteredTransactions();
  });

  catSelect.addEventListener('change', (e) => {
    filterCategory = e.target.value;
    renderFilteredTransactions();
  });

  // Advanced date filters
  const yearSel = document.getElementById('filterYear');
  const monthSel = document.getElementById('filterMonth');
  const weekSel = document.getElementById('filterWeekOfMonth');
  const daySel = document.getElementById('filterDayOfWeek');
  const btnClearDate = document.getElementById('btnClearDateFilters');

  if (yearSel) yearSel.addEventListener('change', (e) => { filterYear = e.target.value; refreshView(); });
  if (monthSel) monthSel.addEventListener('change', (e) => { filterMonth = e.target.value; refreshView(); });
  if (weekSel) weekSel.addEventListener('change', (e) => { filterWeekOfMonth = e.target.value; refreshView(); });
  if (daySel) daySel.addEventListener('change', (e) => { filterDayOfWeek = e.target.value; refreshView(); });
  if (btnClearDate) btnClearDate.addEventListener('click', () => { resetDateFilters(); refreshView(); });
}

/**
 * Filter data by active mode (weekly vs all)
 */
function getScopedTransactions() {
  const allTx = getTransactions();
  if (currentMode === 'weekly') {
    const week = getCurrentWeekRange();
    return allTx.filter(t => isDateWithinRange(t.date, week.startStr, week.endStr));
  }
  return allTx;
}

/**
 * Apply all active date + text filters on top of the mode-scoped data.
 * This is the single source of truth for what the dashboard currently shows.
 */
function getFilteredData() {
  const scopedData = getScopedTransactions();

  // In weekly mode there are no extra date filters — return scoped data directly
  if (currentMode === 'weekly') return scopedData;

  return scopedData.filter(tx => {
    const txYear  = tx.date?.slice(0, 4);
    const txMonth = tx.date ? String(parseInt(tx.date.slice(5, 7), 10)) : null;
    const matchesYear  = filterYear === 'all' || txYear === filterYear;
    const matchesMonth = filterMonth === 'all' || txMonth === filterMonth;
    const matchesWeek  = filterWeekOfMonth === 'all' || getWeekOfMonth(tx.date) === parseInt(filterWeekOfMonth, 10);
    const matchesDay   = filterDayOfWeek === 'all' || getDayOfWeek(tx.date) === parseInt(filterDayOfWeek, 10);
    return matchesYear && matchesMonth && matchesWeek && matchesDay;
  });
}

/**
 * Refresh whole dashboard view based on current mode
 */
function refreshView() {
  const badge = document.getElementById('periodBadge');
  const datesText = document.getElementById('periodDatesText');
  const btnReset = document.getElementById('btnResetWeeklyData');
  const listTitle = document.getElementById('listSectionTitle');
  const listSubtitle = document.getElementById('listSectionSubtitle');
  const flowSubtitle = document.getElementById('flowChartSubtitle');

  // Use the fully-filtered dataset for EVERYTHING on the dashboard
  const dashboardData = getFilteredData();

  if (currentMode === 'weekly') {
    const week = getCurrentWeekRange();
    badge.textContent = 'Minggu Ini';
    badge.className = 'badge';
    datesText.textContent = formatWeekRangeDisplay(week.start, week.end);
    btnReset.style.display = 'inline-flex';
    listTitle.textContent = 'Daftar Transaksi Minggu Ini';
    listSubtitle.textContent = 'Transaksi yang tercatat dalam siklus mingguan aktif';
    flowSubtitle.textContent = 'Arus Kas Harian (Senin - Minggu)';
  } else {
    const hasDateFilter = filterYear !== 'all' || filterMonth !== 'all' ||
                          filterWeekOfMonth !== 'all' || filterDayOfWeek !== 'all';
    badge.textContent = hasDateFilter ? 'Filter Aktif' : 'Semua Periode';
    badge.className = hasDateFilter ? 'badge filter-active' : 'badge all-time';
    datesText.textContent = hasDateFilter
      ? `Menampilkan ${dashboardData.length} transaksi sesuai filter`
      : 'Riwayat Lengkap Keuangan';
    btnReset.style.display = 'none';
    listTitle.textContent = 'Semua Riwayat Transaksi';
    listSubtitle.textContent = hasDateFilter
      ? 'Hasil filter periode yang dipilih'
      : 'Seluruh data transaksi yang pernah dicatat';
    flowSubtitle.textContent = hasDateFilter ? 'Arus Kas (Periode Terfilter)' : 'Arus Kas Keseluruhan';

    // Populate year dropdown dynamically from all data
    populateYearDropdown();
  }

  // Show / hide date filter row based on mode
  const dateFilterRow = document.getElementById('dateFilterRow');
  if (dateFilterRow) {
    if (currentMode === 'all') {
      dateFilterRow.classList.remove('hidden');
    } else {
      dateFilterRow.classList.add('hidden');
    }
  }

  // Update stat totals — use filtered dataset
  updateStats(dashboardData, currentMode);

  // Render Charts — use filtered dataset
  renderCharts(dashboardData, currentMode);

  // Render filtered list
  renderFilteredTransactions();
}

/**
 * Populate the year dropdown with years derived from all stored transactions.
 */
function populateYearDropdown() {
  const yearSel = document.getElementById('filterYear');
  if (!yearSel) return;
  const allTx = getTransactions();
  const years = extractYears(allTx);
  const current = yearSel.value;
  yearSel.innerHTML = `<option value="all">Semua Tahun</option>` +
    years.map(y => `<option value="${y}">${y}</option>`).join('');
  // Restore previous selection if still valid
  if (years.includes(current)) yearSel.value = current;
}

/**
 * Render transaction list with text/type/category filters applied on top of getFilteredData().
 */
function renderFilteredTransactions() {
  const dateFilteredData = getFilteredData();

  const filtered = dateFilteredData.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(filterSearch);
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCat  = filterCategory === 'all' || tx.category === filterCategory;
    return matchesSearch && matchesType && matchesCat;
  });

  renderTransactionsList(filtered, (id) => {
    deleteTransaction(id);
    refreshView();
  });
}
