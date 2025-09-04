export class AuthError extends Error {
  readonly name = 'AuthError';
  
  constructor(
    message: string,
    public readonly code: string = 'AUTH_ERROR'
  ) {
    super(message);
    // Fix for instanceof in transpiled code
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ValidationError extends Error {
  readonly name = 'ValidationError';
  
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    // Fix for instanceof in transpiled code
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class DatabaseError extends Error {
  readonly name = 'DatabaseError';
  
  constructor(message: string) {
    super(message);
    // Fix for instanceof in transpiled code
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// Type guard functions to check error types
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError || (error instanceof Error && error.name === 'AuthError');
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError || (error instanceof Error && error.name === 'ValidationError');
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError || (error instanceof Error && error.name === 'DatabaseError');
}
