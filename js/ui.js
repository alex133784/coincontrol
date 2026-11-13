import {
  CATEGORIES,
  getCategoryById,
  calculateDailyLimit,
  analyzeExpenses,
  forecastGoal
} from './finance.js';
import { renderDonutChart } from './charts.js';

function formatMoney(val) {
  return `${Math.round(val).toLocaleString('ru-RU')} ₽`;
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) +
    ', ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function renderCategoryGrid(onSelectCategory) {
  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';

  CATEGORIES.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'cat-tile';
    btn.innerHTML = `
      <span class="cat-icon" style="background: ${cat.color}22; color: ${cat.color};">${cat.icon}</span>
      <span class="cat-name">${cat.name}</span>
    `;
    btn.addEventListener('click', () => onSelectCategory(cat));
    grid.appendChild(btn);
  });
}

export function renderBalanceScreen(state, onDeleteTx) {
  document.getElementById('total-balance').textContent = formatMoney(state.balance);
  document.getElementById('days-badge').textContent = `Лимит на ${state.daysRemaining} дн.`;
  const daily = calculateDailyLimit(state.balance, state.daysRemaining);
  document.getElementById('daily-limit').textContent = `${formatMoney(daily)} / день`;

  const list = document.getElementById('transaction-list');
  const countEl = document.getElementById('tx-count');
  countEl.textContent = `${state.transactions.length} записей`;

  if (!state.transactions.length) {
    list.innerHTML = '<li class="empty-state">Операций пока нет. Нажмите на плитку категории выше или «+ Доход».</li>';
    return;
  }

  list.innerHTML = '';
  state.transactions.slice(0, 20).forEach((tx) => {
    const cat = getCategoryById(tx.category);
    const isIncome = tx.type === 'income';
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.innerHTML = `
      <div class="tx-left">
        <span class="tx-dot" style="background: ${cat.color}22; color: ${cat.color};">${cat.icon}</span>
        <div class="tx-info">
          <div class="tx-title">${tx.note}</div>
          <div class="tx-meta">${cat.name} • ${formatDate(tx.timestamp)}</div>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount ${isIncome ? 'income' : 'expense'}">
          ${isIncome ? '+' : '−'}${formatMoney(tx.amount)}
        </span>
        <button class="tx-delete" title="Удалить запись" aria-label="Удалить">✕</button>
      </div>
    `;
    li.querySelector('.tx-delete').addEventListener('click', () => onDeleteTx(tx.id));
    list.appendChild(li);
  });
}

export function renderAnalyticsScreen(state, period) {
  const stats = analyzeExpenses(state.transactions, period);
  document.getElementById('chart-total').textContent = formatMoney(stats.total);
  document.getElementById('chart-avg').textContent = `Ср. чек: ${formatMoney(stats.avg)}`;
  document.getElementById('insight-text').textContent = stats.insight;

  const canvas = document.getElementById('expense-chart');
  renderDonutChart(canvas, stats.byCategory, stats.total);

  const breakdown = document.getElementById('category-breakdown');
  if (!stats.byCategory.length) {
    breakdown.innerHTML = '<div class="empty-state">За выбранный период расходов не зафиксировано.</div>';
    return;
  }

  breakdown.innerHTML = '';
  stats.byCategory.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'breakdown-item';
    div.innerHTML = `
      <div class="breakdown-top">
        <span>${item.icon} ${item.name}</span>
        <span>${formatMoney(item.sum)} (${item.percent}%)</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: ${item.percent}%; background: ${item.color};"></div>
      </div>
    `;
    breakdown.appendChild(div);
  });
}

export function renderSavingsScreen(state) {
  const { goal, savingsLog, autoSaveEnabled } = state;
  document.getElementById('goal-title').textContent = goal.title;
  document.getElementById('goal-current').textContent = formatMoney(goal.current);
  document.getElementById('goal-target').textContent = `из ${formatMoney(goal.target)}`;

  const percent = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const remaining = Math.max(0, goal.target - goal.current);

  document.getElementById('goal-progress-bar').style.width = `${percent}%`;
  document.getElementById('goal-percent').textContent = `${percent}%`;
  document.getElementById('goal-remaining').textContent = `Осталось: ${formatMoney(remaining)}`;
  document.getElementById('goal-forecast').textContent = forecastGoal(goal, savingsLog);
  document.getElementById('toggle-autosave').checked = autoSaveEnabled;

  const list = document.getElementById('savings-list');
  if (!savingsLog.length) {
    list.innerHTML = '<li class="empty-state">Журнал накоплений пуст.</li>';
    return;
  }

  list.innerHTML = '';
  savingsLog.forEach((item) => {
    const isPositive = item.amount >= 0;
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.innerHTML = `
      <div class="tx-left">
        <span class="tx-dot" style="background: rgba(99, 102, 241, 0.16); color: #6366F1;">🎯</span>
        <div class="tx-info">
          <div class="tx-title">${item.source}</div>
          <div class="tx-meta">${formatDate(item.timestamp)}</div>
        </div>
      </div>
      <span class="tx-amount ${isPositive ? 'income' : 'expense'}">
        ${isPositive ? '+' : '−'}${formatMoney(Math.abs(item.amount))}
      </span>
    `;
    list.appendChild(li);
  });
}

export function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 2400);
}