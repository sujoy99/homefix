import { AppError } from '@errors/app-error';
import { ErrorCode } from './error-code';

export class BadRequestError extends AppError {
  constructor(errorCode = ErrorCode.BAD_REQUEST, message = 'Bad request') {
    super(message, 400, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(errorCode= ErrorCode.UNAUTHORIZED, message = 'Unauthorized') {
    super(message, 401, errorCode);
  }
}

export class ForbiddenError extends AppError {
  constructor(errorCode = ErrorCode.FORBIDDEN,  message = 'Forbidden') {
    super(message, 403, errorCode);
  }
}

export class DuplicateError extends AppError {
  constructor(errorCode = ErrorCode.ALREADY_EXISTS, message = 'Already exists') {
    super(message, 409, errorCode);
  }
}

export class NotFoundError extends AppError {
  constructor(errorCode = ErrorCode.RESOURCE_NOT_FOUND, message = 'Resource not found') {
    super(message, 404, errorCode);
  }
}
