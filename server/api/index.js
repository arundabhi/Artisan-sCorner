import '../src/config/env.js';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

// Connect to MongoDB
connectDB();

export default app;
