import bcrypt from 'bcrypt';

const saltRounds = 12;

/**
 * Securely converts values to hash value using strong salt
 */
export const hashedPassword = async (value: string): Promise<string> => {
  return await bcrypt.hash(value, saltRounds);
};
