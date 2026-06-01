import http from './http.js';

export function getDetail(yearMonth, type) {
  const params = { yearMonth };
  if (type && type !== 'all') params.type = type.toUpperCase();
  return http.get('/records/detail', { params });
}


export function createRecord(payload) {
  return http.post('/records', payload);
}

export function updateRecord(id, payload) {
  return http.patch(`/records/${id}`, payload);
}

export function deleteRecord(id) {
  return http.delete(`/records/${id}`);
}

export function getSummary(month) {
  return http.get('/records/summary', { params: { month } });
}

export function getDailySummary(month) {
  return http.get('/records/summary/daily', { params: { month } });
}

export function getClosing(month) {
  return http.get('/records/closing', { params: { month } });
}
