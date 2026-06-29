// Flex Budget - app.js
// Handles screen transitions, income calculation, expense tracking, and charts

let expenses = [];
let safeToSpend = 0;
let totalIncome = 0;
let spendingChart = null;

const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const $ = id => document.getElementById(id);

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); }, 2200);
  setTimeout(() => { t.classList.add('hidden'); }, 2500);
}

// Screen transitions
function goTo(targetId, fromId) {
  const from = $(fromId);
  const to = $(targetId);
  from.classList.add('slide-out');
  setTimeout(() => {
    from.classList.remove('active', 'slide-out');
    from.style.display = 'none';
    to.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { to.classList.add('active'); });
    });
  }, 320);
}

$('start-btn').addEventListener('click', () => goTo('screen-income', 'screen-landing'));
$('back-to-landing').addEventListener('click', () => goTo('screen-landing', 'screen-income'));
$('back-to-income').addEventListener('click', () => goTo('screen-income', 'screen-dashboard'));

// Update the income preview total as the user types
function updatePreview() {
  const amounts = document.querySelectorAll('.src-amount');
  let total = 0;
  amounts.forEach(i => { total += parseFloat(i.value) || 0; });
  totalIncome = total;
  $('preview-total').textContent = fmt(total);
}

document.addEventListener('input', e => {
  if (e.target.classList.contains('src-amount')) updatePreview();
});

// Add a new income source row
let sourceCount = 1;
$('add-source-btn').addEventListener('click', () => {
  sourceCount++;
  const wrap = $('sources-wrap');
  const row = document.createElement('div');
  row.className = 'source-row';
  row.dataset.index = sourceCount - 1;
  row.innerHTML = `
    <div class="source-tag">${String(sourceCount).padStart(2, '0')}</div>
    <input type="text" class="src-name" placeholder="e.g. Side project" />
    <div class="src-amount-wrap">
      <span class="dollar-sign">$</span>
      <input type="number" class="src-amount" placeholder="0" min="0" />
    </div>
    <button class="remove-source" title="Remove">×</button>
  `;
  wrap.appendChild(row);
  row.querySelector('.src-name').focus();
  document.querySelectorAll('.remove-source').forEach(b => b.classList.remove('hidden'));
});

document.addEventListener('click', e => {
  if (e.target.classList.contains('remove-source')) {
    const row = e.target.closest('.source-row');
    row.remove();
    updatePreview();
    document.querySelectorAll('.source-row').forEach((r, i) => {
      r.querySelector('.source-tag').textContent = String(i + 1).padStart(2, '0');
    });
    if (document.querySelectorAll('.source-row').length <= 1) {
      document.querySelectorAll('.remove-source').forEach(b => b.classList.add('hidden'));
    }
  }
});

// Calculate budget and confidence score
$('calculate-btn').addEventListener('click', () => {
  const amounts = document.querySelectorAll('.src-amount');
  let total = 0;
  amounts.forEach(i => { total += parseFloat(i.value) || 0; });

  if (total <= 0) { showToast('Enter at least one income amount.'); return; }

  totalIncome = total;
  const past1 = parseFloat($('past1').value) || total;
  const past2 = parseFloat($('past2').value) || total;
  const pastAvg = (past1 + past2) / 2;

  // Confidence score based on deviation from 3-month average
  const avg3 = (past1 + past2 + total) / 3;
  const deviation = Math.abs(total - avg3) / avg3;
  let confidence = Math.round(100 - deviation * 100);
  confidence = Math.max(8, Math.min(100, confidence));

  // Surge: income more than 30% above past average
  const isSurge = pastAvg > 0 && total > pastAvg * 1.3;

  // Spending allocations scale with income stability
  let spendR, saveR, bufferR;
  if (confidence >= 75) { spendR = 0.70; saveR = 0.20; bufferR = 0.10; }
  else if (confidence >= 45) { spendR = 0.60; saveR = 0.25; bufferR = 0.15; }
  else { spendR = 0.50; saveR = 0.30; bufferR = 0.20; }

  safeToSpend = Math.round(total * spendR);
  const savings = Math.round(total * saveR);
  const buffer  = Math.round(total * bufferR);

  goTo('screen-dashboard', 'screen-income');

  setTimeout(() => {
    animateMeter(confidence);
    animateBars(total, safeToSpend, savings, buffer, spendR, saveR, bufferR);
    updateBadges(confidence, isSurge);
    expenses = [];
    renderExpenses();
    renderChart();
  }, 400);
});

// Animated arc meter for confidence score
function animateMeter(target) {
  const canvas = $('meterCanvas');
  const ctx = canvas.getContext('2d');
  const W = 220, H = 220;
  canvas.width = W; canvas.height = H;
  const cx = W / 2, cy = H / 2, r = 88;
  const startAngle = Math.PI * 0.75;
  const totalArc = Math.PI * 1.5;

  let color;
  if (target >= 75) color = '#00e5c0';
  else if (target >= 45) color = '#ffab40';
  else color = '#ff4d6d';

  const score = $('meter-score');

  function draw(val) {
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + totalArc);
    ctx.strokeStyle = '#1e2330';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();

    const fillEnd = startAngle + (totalArc * val / 100);
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, fillEnd);
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  draw(0);
  const duration = 1200;
  const start = performance.now();

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const current = ease * target;
    draw(current);
    score.textContent = Math.round(current);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// Animate the budget allocation bars
function animateBars(total, spend, save, buffer, sr, savr, bufr) {
  $('val-spend').textContent  = fmt(spend);
  $('val-save').textContent   = fmt(save);
  $('val-buffer').textContent = fmt(buffer);
  setTimeout(() => {
    $('fill-spend').style.width  = (sr   * 100) + '%';
    $('fill-save').style.width   = (savr * 100) + '%';
    $('fill-buffer').style.width = (bufr * 100) + '%';
  }, 100);
}

// Set confidence status text and surge/compliance badges
function updateBadges(confidence, isSurge) {
  const dot    = $('status-dot');
  const text   = $('status-text');
  const explain = $('meter-explain');

  if (confidence >= 75) {
    dot.style.background = '#00e5c0';
    text.textContent = 'Stable income';
    explain.textContent = "Your income is consistent. You can spend up to 70% safely — savings and buffer cover the rest.";
  } else if (confidence >= 45) {
    dot.style.background = '#ffab40';
    text.textContent = 'Variable income';
    explain.textContent = "Some variability detected. A slightly higher buffer is recommended to protect against dips.";
  } else {
    dot.style.background = '#ff4d6d';
    text.textContent = 'Irregular income';
    explain.textContent = "High variability — the app is protecting 50% of your income before spending. Stay cautious.";
  }

  isSurge
    ? $('surge-pill').classList.remove('hidden')
    : $('surge-pill').classList.add('hidden');
}

// Expense tracking
$('add-exp-btn').addEventListener('click', addExpense);
$('exp-amt').addEventListener('keydown', e => { if (e.key === 'Enter') addExpense(); });

function addExpense() {
  const cat = $('exp-cat').value.trim();
  const amt = parseFloat($('exp-amt').value);
  if (!cat || !amt || amt <= 0) { showToast('Enter a category and amount.'); return; }
  expenses.push({ id: Date.now(), category: cat, amount: amt });
  $('exp-cat').value = '';
  $('exp-amt').value = '';
  $('exp-cat').focus();
  renderExpenses();
  renderChart();
  checkCompliance();
}

function removeExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  renderExpenses();
  renderChart();
  checkCompliance();
}

function renderExpenses() {
  const list = $('expense-list');
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const remaining = safeToSpend - totalSpent;

  if (expenses.length === 0) {
    list.innerHTML = '<div class="empty-state">No expenses logged yet.<br>Add one above to start tracking.</div>';
  } else {
    list.innerHTML = expenses.map(e => `
      <div class="exp-item">
        <span class="exp-cat">${e.category}</span>
        <span class="exp-amt">${fmt(e.amount)}</span>
        <button class="exp-del" onclick="removeExpense(${e.id})">×</button>
      </div>
    `).join('');
  }

  $('total-spent').textContent = fmt(totalSpent);

  $('remaining-label').innerHTML = remaining >= 0
    ? `Remaining: <strong id="remaining" class="pos">${fmt(remaining)}</strong>`
    : `Over budget by: <strong id="remaining" class="neg">${fmt(Math.abs(remaining))}</strong>`;

  // Progress bar color shifts as you approach the limit
  const pct = safeToSpend > 0 ? Math.min((totalSpent / safeToSpend) * 100, 100) : 0;
  const fill = $('spent-fill');
  fill.style.width = pct + '%';
  fill.style.background = pct > 90 ? '#ff4d6d' : pct > 70 ? '#ffab40' : '#00e5c0';
}

function checkCompliance() {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const badge = $('compliance-pill');
  if (expenses.length > 0 && totalSpent <= safeToSpend) {
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// Spending breakdown donut chart
function renderChart() {
  const emptyEl = $('chart-empty');
  const wrapEl  = $('chart-wrap');

  if (expenses.length === 0) {
    emptyEl.classList.remove('hidden');
    wrapEl.classList.add('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  wrapEl.classList.remove('hidden');

  const palette = ['#00e5c0','#ffab40','#ff4d6d','#7c6af7','#3db8f5','#f77c6a','#a3e635','#e879f9'];
  const labels  = expenses.map(e => e.category);
  const data    = expenses.map(e => e.amount);
  const colors  = expenses.map((_, i) => palette[i % palette.length]);

  if (spendingChart) spendingChart.destroy();

  spendingChart = new Chart($('spendingChart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      cutout: '65%',
      animation: { animateRotate: true, duration: 700 },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { family: 'JetBrains Mono', size: 11 },
            color: '#6b7280',
            padding: 14,
            boxWidth: 12,
            boxHeight: 12,
          }
        }
      }
    }
  });
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Reset everything and go back to landing
$('restart-btn').addEventListener('click', () => {
  expenses = [];
  safeToSpend = 0;
  totalIncome = 0;
  sourceCount = 1;

  $('sources-wrap').innerHTML = `
    <div class="source-row" data-index="0">
      <div class="source-tag">01</div>
      <input type="text" class="src-name" placeholder="e.g. Freelance design" />
      <div class="src-amount-wrap">
        <span class="dollar-sign">$</span>
        <input type="number" class="src-amount" placeholder="0" min="0" />
      </div>
      <button class="remove-source hidden" title="Remove">×</button>
    </div>
  `;
  $('past1').value = '';
  $('past2').value = '';
  $('preview-total').textContent = '$0';

  if (spendingChart) { spendingChart.destroy(); spendingChart = null; }
  goTo('screen-landing', 'screen-dashboard');
});
