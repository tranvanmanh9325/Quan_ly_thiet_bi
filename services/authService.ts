
import { User } from "../types";

const API_BASE_URL = "http://localhost:5000/api/auth";

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }

    return data as AuthResponse;
  },

  register: async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Đăng ký thất bại");
    }

    return data as AuthResponse;
  }
};
