import { z } from 'zod';
import { registerSchema, userRegistrationSchema, loginSchema, userLoginSchema } from './auth.schema';

export type RegisterDTO = z.infer<typeof registerSchema>['body'];
export type UserRegistrationDTO = z.infer<typeof userRegistrationSchema>['body']; // V2 registration implementation
export type LoginDTO = z.infer<typeof loginSchema>['body'];
