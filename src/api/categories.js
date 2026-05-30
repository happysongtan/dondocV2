// Category IDs must align with the backend. IDs below are assumed values.
export const INCOME_CATEGORIES = [
  { id: 1, name: '월급', icon: 'income_salary', type: 'INCOME' },
  { id: 2, name: '부수입', icon: 'income_side', type: 'INCOME' },
  { id: 3, name: '투자수익', icon: 'income_invest', type: 'INCOME' },
  { id: 4, name: '용돈', icon: 'income_allowance', type: 'INCOME' },
  { id: 5, name: '기타수입', icon: 'income_etc', type: 'INCOME' },
];

export const EXPENSE_CATEGORIES = [
  { id: 6, name: '식비', icon: 'food', type: 'EXPENSE' },
  { id: 7, name: '교통비', icon: 'bus', type: 'EXPENSE' },
  { id: 8, name: '쇼핑', icon: 'shopping', type: 'EXPENSE' },
  { id: 9, name: '문화생활', icon: 'movie', type: 'EXPENSE' },
  { id: 10, name: '의료/건강', icon: 'hospital', type: 'EXPENSE' },
  { id: 11, name: '교육', icon: 'education', type: 'EXPENSE' },
  { id: 12, name: '주거/통신', icon: 'house', type: 'EXPENSE' },
  { id: 13, name: '기타지출', icon: 'expense', type: 'EXPENSE' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryById(id) {
  const numericId = Number(id);
  return ALL_CATEGORIES.find((c) => c.id === numericId) ?? null;
}

export function getCategoryIconByName(name, type) {
  const cats =
    String(type).toUpperCase() === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return cats.find((c) => c.name === name)?.icon ?? 'expense';
}
