const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    } else {
        // In production, log minimal info
        console.error(`[Error] ${req.method} ${req.path}: ${err.message}`);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        error = { message: 'Resource not found', statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        error = { message: `Duplicate value for ${field}`, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error = { message: messages.join(', '), statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = { message: 'Invalid token', statusCode: 401 };
    }
    if (err.name === 'TokenExpiredError') {
        error = { message: 'Token expired', statusCode: 401 };
    }

    // Express-validator errors (if thrown manually)
    if (err.type === 'entity.parse.failed') {
        error = { message: 'Invalid JSON in request body', statusCode: 400 };
    }

    // Multer file size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = { message: 'File too large', statusCode: 400 };
    }

    // CORS error
    if (err.message === 'Not allowed by CORS') {
        error = { message: 'CORS: Origin not allowed', statusCode: 403 };
    }

    // Rate limit error (shouldn't reach here but just in case)
    if (err.status === 429) {
        error = { message: 'Too many requests', statusCode: 429 };
    }

    const statusCode = error.statusCode || err.statusCode || 500;
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'Server Error';

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

export default errorHandler;