import { DuplicateError } from './http-errors';
import { ErrorCode } from './error-code';

// Maps exact Postgres constraint names to typed errors.
// Add new entries here when new unique constraints are added to any table.
const CONSTRAINT_MAP: Record<string, [ErrorCode, string]> = {
  users_mobile_unique: [ErrorCode.MOBILE_ALREADY_EXISTS, 'Mobile number already registered'],
  users_nid_unique:    [ErrorCode.NID_ALREADY_EXISTS,    'NID already registered'],
  users_email_unique:  [ErrorCode.EMAIL_ALREADY_EXISTS,  'Email address already registered'],
};

export function mapUniqueViolation(constraint: string): DuplicateError {
  const entry = CONSTRAINT_MAP[constraint];
  if (entry) {
    const [code, message] = entry;
    return new DuplicateError(code, message);
  }
  return new DuplicateError(ErrorCode.ALREADY_EXISTS, 'Record already exists');
}
