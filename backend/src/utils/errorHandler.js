const errorHandler = (err, _, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";
    console.log(message)
    res.status(statusCode).json({
        statusCode: statusCode,
        message: message,
    });
};

export default errorHandler;