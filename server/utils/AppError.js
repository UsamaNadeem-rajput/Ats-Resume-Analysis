class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);           
    this.statusCode = statusCode; 
    this.code = code;             // Machine-readable naam: 'UNAUTHORIZED', 'NOT_FOUND' ...
    Error.captureStackTrace(this, this.constructor); // stack trace mein AppError khud na aaye
  }
}
 
module.exports = AppError;