import api from './api';

export interface RegisterInput {
  email: string;
  password: string;
  orgName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function registerRequest(data: RegisterInput) {
  const res = await api.post('/auth/register', data);
  return res.data;
}

export async function loginRequest(data: LoginInput) {
  const res = await api.post('/auth/login', data);
  return res.data;
}

export async function getMeRequest() {
  const res = await api.get('/auth/me');
  return res.data;
}
