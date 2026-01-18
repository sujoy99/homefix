import { Response } from 'express';
import { ApiResponse, FieldError, PaginatedBody } from './response.types';

export class HttpResponse {
  static success<T>(
    res: Response,
    body: T,
    message = 'Success',
    statusCode = 200
  ) {
    const response: ApiResponse<T> = {
      http_code: statusCode,
      message,
      body,
    };

    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    items: T[],
    page: number,
    limit: number,
    total: number,
    message = 'Success'
  ) {
    const response: ApiResponse<PaginatedBody<T>> = {
      http_code: 200,
      message,
      body: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };

    return res.status(200).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number,
    errors?: ReadonlyArray<FieldError>
  ) {
    const response: ApiResponse<null> = {
      http_code: statusCode,
      message,
      body: null,
      ...(errors ? { errors } : {}),
    };

    return res.status(statusCode).json(response);
  }
}
