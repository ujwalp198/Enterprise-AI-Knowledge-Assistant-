import api from './api';

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function listDocuments() {
  const res = await api.get('/documents');
  return res.data.documents;
}
