const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      if (res.headersSent) {
        console.warn(
          "🚨 Tried to handle error after headers sent:",
          err.message,
        );
        return;
      }
      next(err);
    });
  };
};

export { asyncHandler };
