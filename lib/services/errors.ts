/**
 * Expected, user-facing failures raised by the service/domain layer
 * (e.g. validation). Transport adapters (server actions, future HTTP
 * controllers) catch these and surface the message; anything else is an
 * unexpected error and should be logged and shown generically.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
