/**
 * Error operacional conocido de la API.
 * Permite lanzar errores con un código HTTP semántico desde cualquier capa
 * (servicios, guards, routers) y que el manejador global los traduzca de forma segura.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(msg = 'Solicitud inválida') {
    return new ApiError(400, msg);
  }
  static unauthorized(msg = 'No autenticado') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Acceso denegado') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Recurso no encontrado') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflicto con el estado actual del recurso') {
    return new ApiError(409, msg);
  }
}
