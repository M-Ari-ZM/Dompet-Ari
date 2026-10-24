/**
 * Charts Module
 * Manages Chart.js instances for Cash Flow comparison and Category breakdown
 */

let flowChartInstance = null;
let categoryChartInstance = null;

export function renderCharts(transactions, mode = 'weekly') {
  renderFlowChart(transactions, mode);
  renderCategoryChart(transactions);
}

function renderFlowChart(transactions, mode) {
  const ctx = document.getElementById('cashFlowChart');
  if (!ctx) return;

  if (flowChartInstance) {
    flowChartInstance.destroy();
  }

  // Aggregate by day or chronologically
  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  // Calculate summary or day-by-day
  let labels = [];
  let incomeData = [];
  let expenseData = [];

  if (mode === 'weekly') {
    labels = dayNames;
    // Map 0 to 6 for Mon-Sun
    incomeData = [0, 0, 0, 0, 0, 0, 0];
    expenseData = [0, 0, 0, 0, 0, 0, 0];

    transactions.forEach(tx => {
      const d = new Date(tx.date + 'T00:00:00');
      let dayIdx = d.getDay(); // 0 is Sun, 1 is Mon...
      let mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
      if (tx.type === 'income') {
        incomeData[mappedIdx] += Number(tx.amount);
      } else {
        expenseData[mappedIdx] += Number(tx.amount);
      }
    });
  } else {
    // For All Time: Aggregate by last 6 months or transaction dates
    const dateMap = {};
    // Sort transactions ascending by date
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(tx => {
      if (!dateMap[tx.date]) {
        dateMap[tx.date] = { income: 0, expense: 0 };
      }
      if (tx.type === 'income') dateMap[tx.date].income += Number(tx.amount);
      if (tx.type === 'expense') dateMap[tx.date].expense += Number(tx.amount);
    });

    const dates = Object.keys(dateMap).sort().slice(-10); // Sort first, then take last 10
    labels = dates.map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    });
    incomeData = dates.map(d => dateMap[d].income);
    expenseData = dates.map(d => dateMap[d].expense);

    if (labels.length === 0) {
      labels = ['Belum ada data'];
      incomeData = [0];
      expenseData = [0];
    }
  }

  flowChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          backgroundColor: '#86efac',
          borderRadius: 4,
          barPercentage: 0.55,
          categoryPercentage: 0.75
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          backgroundColor: '#fda4af',
          borderRadius: 4,
          barPercentage: 0.55,
          categoryPercentage: 0.75
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#4a6080',
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
            boxWidth: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#1a2744',
          bodyColor: '#4a6080',
          borderColor: 'rgba(91, 138, 240, 0.25)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return `  ${context.dataset.label}: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#8aa3c2', font: { size: 12 } }
        },
        y: {
          grid: { color: 'rgba(91, 138, 240, 0.07)', drawTicks: false },
          border: { display: false, dash: [4, 4] },
          ticks: {
            color: '#8aa3c2',
            font: { size: 12 },
            padding: 8,
            callback: function(val) {
              if (val >= 1000000) return (val / 1000000).toFixed(1) + ' Jt';
              if (val >= 1000)    return (val / 1000).toFixed(0) + ' Rb';
              return val;
            }
          }
        }
      }
    }
  });
}

function renderCategoryChart(transactions) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  // Calculate expense categories
  const expenses = transactions.filter(t => t.type === 'expense');
  const catSums = {};

  expenses.forEach(t => {
    catSums[t.category] = (catSums[t.category] || 0) + Number(t.amount);
  });

  const categoryNames = {
    makan: 'Makanan & Minuman',
    transport: 'Transportasi',
    tagihan: 'Tagihan & WiFi',
    belanja: 'Kebutuhan Harian',
    hiburan: 'Hiburan',
    kesehatan: 'Kesehatan',
    lainnya_ex: 'Lain-lain'
  };

  const labels = Object.keys(catSums).map(k => categoryNames[k] || k);
  const dataValues = Object.values(catSums);

  const colors = [
    '#93bbf9', '#86efac', '#fda4af', '#fcd34d', '#67e8f9', '#f9c6a0', '#b8d4f8'
  ];

  if (dataValues.length === 0) {
    categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Belum ada pengeluaran'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(91, 138, 240, 0.08)'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 50,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        cutout: '72%'
      }
    });
    return;
  }

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#4a6080',
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '600' },
            boxWidth: 10,
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 14
          }
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#1a2744',
          bodyColor: '#4a6080',
          borderColor: 'rgba(91, 138, 240, 0.25)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const val = context.parsed;
              return `  ${context.label}: Rp ${val.toLocaleString('id-ID')}`;
            }
          }
        }
      },
      cutout: '72%'
    }
  });
}
