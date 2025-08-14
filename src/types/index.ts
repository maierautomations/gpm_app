export * from './navigation';

export interface User {
  id: string;
  email: string;
  name?: string;
  loyaltyPoints?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}