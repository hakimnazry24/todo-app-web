import { request } from './client';
import type { LoginResponse, Task, User } from './types';

export const authApi = {
  signup(input: { username: string; password: string; phoneNumber: string }) {
    return request<User>('/auth/signup', {
      method: 'POST',
      body: input,
      allowUnauthorized: true,
    });
  },

  login(input: { username: string; password: string }) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: input,
      allowUnauthorized: true,
    });
  },

  logout() {
    return request<{ success: true }>('/auth/logout', { method: 'POST' });
  },

  me() {
    return request<User>('/auth/me');
  },
};

export const tasksApi = {
  list() {
    return request<Task[]>('/tasks');
  },

  create(input: { name: string; description: string }) {
    return request<Task>('/tasks', { method: 'POST', body: input });
  },

  complete(id: string) {
    return request<Task>(`/tasks/${id}/complete`, { method: 'PATCH' });
  },
};
