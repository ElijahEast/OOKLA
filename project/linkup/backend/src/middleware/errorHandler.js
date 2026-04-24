function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, fields: err.fields });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ error: 'Resource already exists.' });
  }

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error.'
    : err.message;

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
