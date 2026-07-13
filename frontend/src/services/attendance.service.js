import api from './api';

export const attendanceService = {
  checkIn: (date) => api.post('/attendance/check-in', { date }),
  breakStart: () => api.post('/attendance/break-start'),
  breakEnd: () => api.post('/attendance/break-end'),
  checkOut: () => api.post('/attendance/check-out'),
  today: () => api.get('/attendance/today'),
  history: (page = 1) => api.get(`/attendance/history?page=${page}`),
  week: () => api.get('/attendance/week'),
  weekByOffset: (offset = 0) => api.get(`/attendance/week-by-offset?offset=${offset}`),
  updateAttendance: (id, data) => api.put(`/attendance/${id}`, data),
  month: () => api.get('/attendance/month'),
};
