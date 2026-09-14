// Jerarquía de errores de la aplicación. Cada subclase fija su código HTTP (LSP: se pueden
// usar donde se espere un AppError sin que el manejador central cambie).
export class AppError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 422); }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) { super(message, 401); }
}

export class ForbiddenError extends AppError {
  constructor(message: string) { super(message, 403); }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}
