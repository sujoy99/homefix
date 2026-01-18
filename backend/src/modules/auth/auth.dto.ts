import { z } from 'zod';
import { registerSchema, loginSchema } from './auth.schema';

export type RegisterDTO = z.infer<typeof registerSchema>['body'];
export type LoginDTO = z.infer<typeof loginSchema>['body'];
