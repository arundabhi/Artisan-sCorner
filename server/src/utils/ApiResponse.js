class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;

    // Spread data properties to root for backwards compatibility with tests and frontend
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      Object.assign(this, data);
    }
  }
}

export { ApiResponse };
