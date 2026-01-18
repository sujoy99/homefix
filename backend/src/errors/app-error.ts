import { FieldError } from '@http/response.types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: ReadonlyArray<FieldError> | undefined;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errors?: ReadonlyArray<FieldError> | undefined,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
}
