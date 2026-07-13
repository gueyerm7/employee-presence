import api from './api';

export const absenceService = {
  types: () => api.get('/absence-types'),
  myRequests: () => api.get('/absences/my'),
  create: (data) => api.post('/absences', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/absences/${id}`),
  all: (params) => api.get('/admin/absences', { params }),
  updateStatus: (id, data) => api.put(`/admin/absences/${id}/status`, data),
};
