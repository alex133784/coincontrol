const STORAGE_KEY = 'coincontrol_db_v1';

const DEFAULT_STATE = {
  balance: 0,
  daysRemaining: 7,
  autoSaveEnabled: true,
  autoSavePercent: 20,
  goal: {
    title: 'Апгрейд ПК / Наушники',
    target: 15000,
    current: 0
  },
  transactions: [],
  savingsLog: []
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      goal: { ...DEFAULT_STATE.goal, ...(parsed.goal || {}) }
    };
  } catch (e) {
    console.error('Ошибка чтения localStorage:', e);
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Ошибка сохранения localStorage:', e);
  }
}

export function resetState() {
  const fresh = structuredClone(DEFAULT_STATE);
  saveState(fresh);
  return fresh;
}

export function createDemoState() {
  const now = Date.now();
  const day = 86400000;
  const demo = {
    balance: 2670,
    daysRemaining: 7,
    autoSaveEnabled: true,
    autoSavePercent: 20,
    goal: {
      title: 'Апгрейд ПК / Наушники',
      target: 15000,
      current: 6400
    },
    transactions: [
      { id: 't1', type: 'expense', category: 'food', amount: 180, note: 'Обед в столовой', timestamp: now - day * 0.2 },
      { id: 't2', type: 'expense', category: 'transport', amount: 70, note: 'Автобус туда-обратно', timestamp: now - day * 0.5 },
      { id: 't3', type: 'expense', category: 'games', amount: 450, note: 'Распродажа Steam', timestamp: now - day * 1.4 },
      { id: 't4', type: 'expense', category: 'food', amount: 230, note: 'Перекус после уроков', timestamp: now - day * 2.1 },
      { id: 't5', type: 'expense', category: 'market', amount: 600, note: 'Коврик для мыши', timestamp: now - day * 3.0 },
      { id: 't6', type: 'income', category: 'income', amount: 2000, note: 'Карманные на неделю', timestamp: now - day * 3.2 }
    ],
    savingsLog: [
      { id: 's1', amount: 400, source: 'Автоотчисление 20% от дохода', timestamp: now - day * 3.2 },
      { id: 's2', amount: 6000, source: 'Стартовый резерв', timestamp: now - day * 10 }
    ]
  };
  saveState(demo);
  return demo;
}

export async function copyStateToClipboard(state) {
  const text = JSON.stringify(state, null, 2);
  await navigator.clipboard.writeText(text);
}

export function exportStateJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `coincontrol-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importStateJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (typeof parsed.balance !== 'number' || !Array.isArray(parsed.transactions)) {
          throw new Error('Некорректный формат файла резервной копии');
        }
        const merged = {
          ...structuredClone(DEFAULT_STATE),
          ...parsed,
          goal: { ...DEFAULT_STATE.goal, ...(parsed.goal || {}) }
        };
        saveState(merged);
        resolve(merged);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsText(file);
  });
}