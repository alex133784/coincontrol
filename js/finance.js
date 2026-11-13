export const CATEGORIES = [
  { id: 'food', name: 'Еда и буфет', icon: '🍔', color: '#EF4444', group: 'needs' },
  { id: 'transport', name: 'Транспорт', icon: '🚌', color: '#3B82F6', group: 'needs' },
  { id: 'games', name: 'Steam и игры', icon: '🎮', color: '#8B5CF6', group: 'wants' },
  { id: 'market', name: 'Маркетплейс', icon: '📦', color: '#EC4899', group: 'wants' },
  { id: 'savings', name: 'В копилку', icon: '🐷', color: '#10B981', group: 'savings' },
  { id: 'other', name: 'Другое', icon: '📎', color: '#6B7280', group: 'wants' }
];

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || {
    id: 'income',
    name: 'Пополнение',
    icon: '💰',
    color: '#10B981',
    group: 'income'
  };
}

export function calculateDailyLimit(balance, daysRemaining = 7) {
  if (balance <= 0 || daysRemaining <= 0) return 0;
  return Math.floor(balance / daysRemaining);
}

export function applyTransaction(state, { type, category, amount, note }) {
  const cleanAmount = Math.round(Number(amount));
  if (!cleanAmount || cleanAmount <= 0) return state;

  const now = Date.now();
  const id = 'tx_' + now + '_' + Math.random().toString(36).slice(2, 6);

  if (type === 'income') {
    let toSavings = 0;
    if (state.autoSaveEnabled && state.autoSavePercent > 0) {
      toSavings = Math.round((cleanAmount * state.autoSavePercent) / 100);
    }
    const toBalance = cleanAmount - toSavings;
    state.balance += toBalance;

    state.transactions.unshift({
      id,
      type: 'income',
      category: 'income',
      amount: cleanAmount,
      note: note || (toSavings > 0 ? `Доход (${toSavings} ₽ в копилку)` : 'Пополнение баланса'),
      timestamp: now
    });

    if (toSavings > 0) {
      state.goal.current += toSavings;
      state.savingsLog.unshift({
        id: 'sav_' + now,
        amount: toSavings,
        source: `Автоотчисление ${state.autoSavePercent}% («Сначала заплати себе»)`,
        timestamp: now
      });
    }
  } else if (type === 'expense') {
    state.balance = Math.max(0, state.balance - cleanAmount);
    const catObj = getCategoryById(category);

    state.transactions.unshift({
      id,
      type: 'expense',
      category,
      amount: cleanAmount,
      note: note || catObj.name,
      timestamp: now
    });

    if (category === 'savings') {
      state.goal.current += cleanAmount;
      state.savingsLog.unshift({
        id: 'sav_' + now,
        amount: cleanAmount,
        source: note || 'Перевод в копилку с баланса',
        timestamp: now
      });
    }
  } else if (type === 'saving_add') {
    const actual = Math.min(cleanAmount, state.balance);
    if (actual <= 0) return state;
    state.balance -= actual;
    state.goal.current += actual;
    state.savingsLog.unshift({
      id: 'sav_' + now,
      amount: actual,
      source: note || 'Ручное пополнение копилки',
      timestamp: now
    });
  } else if (type === 'saving_spend') {
    const actual = Math.min(cleanAmount, state.goal.current);
    if (actual <= 0) return state;
    state.goal.current -= actual;
    state.savingsLog.unshift({
      id: 'sav_' + now,
      amount: -actual,
      source: note || 'Снятие на покупку цели',
      timestamp: now
    });
  }

  return state;
}

export function deleteTransaction(state, txId) {
  const idx = state.transactions.findIndex((t) => t.id === txId);
  if (idx === -1) return state;
  const tx = state.transactions[idx];

  if (tx.type === 'income') {
    state.balance = Math.max(0, state.balance - tx.amount);
  } else if (tx.type === 'expense') {
    state.balance += tx.amount;
    if (tx.category === 'savings') {
      state.goal.current = Math.max(0, state.goal.current - tx.amount);
    }
  }

  state.transactions.splice(idx, 1);
  return state;
}

export function filterTransactionsByPeriod(transactions, period) {
  const now = Date.now();
  const day = 86400000;
  return transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    if (period === 'week') return now - t.timestamp <= 7 * day;
    if (period === 'month') return now - t.timestamp <= 30 * day;
    return true;
  });
}

export function analyzeExpenses(transactions, period = 'week') {
  const expenses = filterTransactionsByPeriod(transactions, period);
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);
  const avg = expenses.length ? Math.round(total / expenses.length) : 0;

  const byCategory = CATEGORIES.map((cat) => {
    const sum = expenses
      .filter((t) => t.category === cat.id)
      .reduce((acc, t) => acc + t.amount, 0);
    const percent = total > 0 ? Math.round((sum / total) * 100) : 0;
    return { ...cat, sum, percent };
  }).filter((item) => item.sum > 0).sort((a, b) => b.sum - a.sum);

  const wantsSum = expenses
    .filter((t) => getCategoryById(t.category).group === 'wants')
    .reduce((acc, t) => acc + t.amount, 0);
  const wantsPercent = total > 0 ? Math.round((wantsSum / total) * 100) : 0;

  let insight = 'Добавьте первые расходы, чтобы увидеть структуру трат и персональные рекомендации.';
  if (total > 0) {
    const top = byCategory[0];
    if (wantsPercent > 40) {
      insight = `На желания и спонтанные покупки (игры, маркетплейсы) ушло ${wantsPercent}% бюджета при норме до 30–40%. Главная статья трат — «${top.name}» (${top.percent}%).`;
    } else {
      insight = `Бюджет сбалансирован: спонтанные траты занимают ${wantsPercent}%. Крупнейшая категория за период — «${top.name}» (${top.sum.toLocaleString('ru-RU')} ₽).`;
    }
  }

  return { total, count: expenses.length, avg, byCategory, insight };
}

export function forecastGoal(goal, savingsLog) {
  const remaining = Math.max(0, goal.target - goal.current);
  if (remaining === 0) return 'Цель полностью достигнута! Можно совершать покупку.';

  const positiveEntries = savingsLog.filter((s) => s.amount > 0);
  if (positiveEntries.length === 0) {
    return 'Включите автоотчисление 20% или пополните копилку, чтобы рассчитать срок.';
  }

  const totalSaved = positiveEntries.reduce((sum, s) => sum + s.amount, 0);
  const avgDeposit = totalSaved / positiveEntries.length;
  const stepsNeeded = Math.ceil(remaining / avgDeposit);
  return `При текущем среднем пополнении (~${Math.round(avgDeposit).toLocaleString('ru-RU')} ₽) цель закроется примерно за ${stepsNeeded} пополн.`;
}