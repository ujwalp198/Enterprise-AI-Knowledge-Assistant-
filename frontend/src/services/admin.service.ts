import api from './api';

export async function getOrgUsers() {
  const res = await api.get('/auth/users');
  return res.data.users;
}

export async function getOrgDocuments() {
  const res = await api.get('/documents');
  return res.data.documents;
}
