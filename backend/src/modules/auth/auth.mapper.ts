import { User } from "@modules/users/user.model";
import { UserRegistrationResponse } from "@modules/users/user.types";
import { AuthAccount } from "./auth.model";

export function mapToUserRegistrationResponse(
  user: Pick<User, 'id' | 'short_code' | 'full_name' | 'mobile' | 'role' | 'status'>,
  auth: Pick<AuthAccount, 'auth_method'>
): UserRegistrationResponse {
  return {
    id: user.id,
    short_code: user.short_code,
    full_name: user.full_name,
    mobile: user.mobile,
    role: user.role,
    status: user.status,
    auth_method: auth.auth_method,
  };
}

export type LoginUserResponse = {
  id: string;
  short_code: string;
  full_name: string;
  mobile: string;
  email?: string | null;
  role: string;
  status: string;
  home_lat: number | null;
  home_lon: number | null;
};

export function mapToLoginUserResponse(
  user: User & { home_lat?: number | null; home_lon?: number | null }
): LoginUserResponse {
  return {
    id: user.id,
    short_code: user.short_code,
    full_name: user.full_name,
    mobile: user.mobile,
    email: user.email ?? null,
    role: user.role,
    status: user.status,
    home_lat: user.home_lat ?? null,
    home_lon: user.home_lon ?? null,
  };
}