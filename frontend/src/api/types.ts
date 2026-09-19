export interface User {
  id: string;
  username: string;
  phoneNumber: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  user: User;
}

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
}
