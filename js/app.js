import {
  loadState,
  saveState,
  resetState,
  createDemoState,
  copyStateToClipboard,
  exportStateJSON,
  importStateJSON
} from './storage.js';
import { applyTransaction, deleteTransaction } from './finance.js';
import {
  renderCategoryGrid,
  renderBalanceScreen,
  renderAnalyticsScreen,
  renderSavingsScreen,
  showToast
} from './ui.js';

let state = loadState();
let currentPeriod = 'week';
let keypadContext = { type: 'expense', category: 'food' };
let keypadBuffer = '0';

function refreshAll() {
  saveState(state);
  renderBalanceScreen(state, handleDeleteTx);
  renderAnalyticsScreen(state, currentPeriod);
  renderSavingsScreen(state);
}

function handleDeleteTx(txId) {
  state = deleteTransaction(state, txId);
  refreshAll();
  showToast('Запись удалена');
}

function openKeypad({ type, category = 'food', title }) {
  keypadContext = { type, category };
  keypadBuffer = '0';
  document.getElementById('keypad-title').textContent = title;
  document.getElementById('keypad-amount').textContent = '0';
  document.getElementById('keypad-note').value = '';
  document.getElementById('modal-keypad').classList.remove('hidden');
}

function closeKeypad() {
  document.getElementById('modal-keypad').classList.add('hidden');
}

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const screens = document.querySelectorAll('.screen');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      navItems.forEach((n) => n.classList.remove('active'));
      screens.forEach((s) => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetId).classList.add('active');
      if (targetId === 'screen-analytics') {
        renderAnalyticsScreen(state, currentPeriod);
      }
    });
  });
}

function initKeypad() {
  document.querySelectorAll('.num-key').forEach((keyBtn) => {
    keyBtn.addEventListener('click', () => {
      const k = keyBtn.dataset.key;
      if (k === 'C') {
        keypadBuffer = '0';
      } else if (k === '⌫') {
        keypadBuffer = keypadBuffer.length > 1 ? keypadBuffer.slice(0, -1) : '0';
      } else {
        if (keypadBuffer.length >= 7) return;
        keypadBuffer = keypadBuffer === '0' ? k : keypadBuffer + k;
      }
      document.getElementById('keypad-amount').textContent = Number(keypadBuffer).toLocaleString('ru-RU');
    });
  });

  document.getElementById('btn-close-keypad').addEventListener('click', closeKeypad);

  document.getElementById('btn-confirm-tx').addEventListener('click', () => {
    const amount = Number(keypadBuffer);
    if (!amount || amount <= 0) {
      showToast('Введите сумму больше 0 ₽');
      return;
    }
    const note = document.getElementById('keypad-note').value.trim();
    state = applyTransaction(state, {
      type: keypadContext.type,
      category: keypadContext.category,
      amount,
      note
    });
    closeKeypad();
    refreshAll();
    showToast('Операция сохранена');
  });
}

function initEvents() {
  document.getElementById('btn-quick-income').addEventListener('click', () => {
    openKeypad({ type: 'income', title: 'Пополнение баланса (+ Доход)' });
  });

  document.getElementById('btn-quick-expense').addEventListener('click', () => {
    openKeypad({ type: 'expense', category: 'other', title: 'Быстрый расход (Другое)' });
  });

  document.querySelectorAll('.period-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.period-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentPeriod = tab.dataset.period;
      renderAnalyticsScreen(state, currentPeriod);
    });
  });

  document.getElementById('toggle-autosave').addEventListener('change', (e) => {
    state.autoSaveEnabled = e.target.checked;
    saveState(state);
    showToast(state.autoSaveEnabled ? 'Автоотчисление 20% включено' : 'Автоотчисление выключено');
  });

  document.getElementById('btn-add-saving').addEventListener('click', () => {
    if (state.balance <= 0) {
      showToast('На балансе нет средств для перевода');
      return;
    }
    openKeypad({ type: 'saving_add', title: 'Перевод в копилку с баланса' });
  });

  document.getElementById('btn-spend-saving').addEventListener('click', () => {
    if (state.goal.current <= 0) {
      showToast('Копилка пока пуста');
      return;
    }
    openKeypad({ type: 'saving_spend', title: 'Снятие из копилки на цель' });
  });

  document.getElementById('btn-edit-goal').addEventListener('click', () => {
    const newTitle = prompt('Название цели накопления:', state.goal.title);
    if (newTitle && newTitle.trim()) {
      state.goal.title = newTitle.trim();
    }
    const newTarget = Number(prompt('Целевая сумма (₽):', state.goal.target));
    if (newTarget && newTarget > 0) {
      state.goal.target = Math.round(newTarget);
    }
    refreshAll();
    showToast('Параметры цели обновлены');
  });

  const settingsModal = document.getElementById('modal-settings');
  document.getElementById('btn-settings').addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  document.getElementById('btn-copy-json').addEventListener('click', async () => {
    try {
      await copyStateToClipboard(state);
      showToast('JSON скопирован в буфер обмена');
    } catch {
      showToast('Не удалось скопировать в буфер');
    }
  });

  document.getElementById('btn-export-json').addEventListener('click', () => {
    exportStateJSON(state);
    showToast('Резервная копия выгружена');
  });

  document.getElementById('input-import-json').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      state = await importStateJSON(file);
      refreshAll();
      settingsModal.classList.add('hidden');
      showToast('База данных восстановлена');
    } catch (err) {
      showToast(err.message);
    }
    e.target.value = '';
  });

  document.getElementById('btn-load-demo').addEventListener('click', () => {
    state = createDemoState();
    refreshAll();
    settingsModal.classList.add('hidden');
    showToast('Демо-данные загружены');
  });

  document.getElementById('btn-reset-all').addEventListener('click', () => {
    state = resetState();
    refreshAll();
    settingsModal.classList.add('hidden');
    showToast('Все данные обнулены');
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategoryGrid((cat) => {
    openKeypad({
      type: 'expense',
      category: cat.id,
      title: `${cat.icon} ${cat.name}`
    });
  });
  initNavigation();
  initKeypad();
  initEvents();
  refreshAll();
  registerServiceWorker();
});