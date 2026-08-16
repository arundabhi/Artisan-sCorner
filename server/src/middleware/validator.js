import { ErrorResponse } from './error.js';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    const errorDetails = error.errors.map((err) => ({
      field: err.path.join('.').replace(/^(body|query|params)\./, ''),
      message: err.message,
    }));
    
    const firstErrorMessage = errorDetails.map(d => `${d.field}: ${d.message}`).join(', ');
    const errRes = new ErrorResponse(firstErrorMessage || 'Validation failed', 400);
    errRes.errors = errorDetails;
    
    next(errRes);
  }
};
