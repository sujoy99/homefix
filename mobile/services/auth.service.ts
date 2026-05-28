import { apiClient } from '../api/client';
import { UserRegistrationPayload, UserLoginPayload } from '@homefix/shared';

export type RegisterResponse = {
  id: string;
  short_code: string;
  full_name: string;
  mobile: string;
  role: string;
  status: string;
  auth_method: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
};

export type LoginResponse = {
  user: {
    id: string;
    short_code: string;
    full_name: string;
    mobile: string;
    email?: string | null;
    role: string;
    status: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
};

export const authService = {
  register: async (data: UserRegistrationPayload): Promise<RegisterResponse> => {
    const response = await apiClient.post('/v2/auth/register', data);
    return response.data.body as RegisterResponse;
  },

  login: async (data: UserLoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post('/v2/auth/login', data);
    return response.data.body as LoginResponse;
  },
};
