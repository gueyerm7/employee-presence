import api from './api';

export const adminService = {
  dashboard: () => api.get('/admin/dashboard'),
  attendances: (params) => api.get('/admin/attendances', { params }),
  users: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  dailyReport: (date) => api.get('/admin/reports/daily', { params: { date } }),
  weeklyReport: (date) => api.get('/admin/reports/weekly', { params: { date } }),
  monthlyReport: (month, year) => api.get('/admin/reports/monthly', { params: { month, year } }),
  exportPdf: (params) => api.get('/admin/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/admin/export/excel', { params, responseType: 'blob' }),
};
