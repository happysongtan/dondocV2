import http from './http.js';

const ICON_MAP = {
  월급: 'income_salary',
  부수입: 'income_side',
  투자수익: 'income_invest',
  용돈: 'income_allowance',
  기타수입: 'income_etc',
  식비: 'food',
  교통비: 'bus',
  쇼핑: 'shopping',
  문화생활: 'movie',
  '의료/건강': 'hospital',
  교육: 'education',
  '주거/통신': 'house',
  기타지출: 'expense',
};

export function getCategories() {
  return http.get('/categories');
}

export function getCategoryIconByName(name) {
  return ICON_MAP[name] ?? 'expense';
}
