const AppError = require('../utils/AppError');
 
const notFound = (req, res, next) => {
  next(new AppError(`Route nahi mila: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
};
 
const errorHandler = (err, req, res, next) => {
 
  let statusCode = 500;
  let code = 'SERVER_ERROR';
  let message = 'Kuch ghalat ho gaya, dobara koshish karein.';
 
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }
 
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }
 
  else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = `Ghalat ID format: ${err.path}`;
  }
 
  else if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue)[0];
    message = `${field} pehle se maujood hai`;
  }
 
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Token ghalat hai, dobara login karein';
  }
 
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Token expire ho gaya, dobara login karein';
  }
 
  else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    code = 'FILE_TOO_LARGE';
    message = `File bohat bari hai. Zyada se zyada ${process.env.MAX_UPLOAD_MB || 5}MB allowed hai`;
  }
 
  
  if (statusCode === 500) {
    console.error('─── SERVER ERROR ───');
    console.error(err);
    console.error('────────────────────');
  }
 
  res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};
 
module.exports = { notFound, errorHandler };