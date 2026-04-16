import api from './api';

export const listCVs = () => api.get('/cvs').then(r => r.data);
export const createCV = (title, cvData) => api.post('/cvs', { title, cvData }).then(r => r.data);
export const getCV = id => api.get(`/cvs/${id}`).then(r => r.data);
export const updateCV = (id, payload) => api.put(`/cvs/${id}`, payload).then(r => r.data);
export const deleteCV = id => api.delete(`/cvs/${id}`).then(r => r.data);
