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