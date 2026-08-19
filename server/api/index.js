import '../src/config/env.js';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

let dbPromise;

const handler = async (req, res) => {
    try {
        if (!dbPromise) {
            dbPromise = connectDB();
        }

        await dbPromise;

        return app(req, res);
    } catch (error) {
        console.error('Vercel API Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message,
        });
    }
};

export default handler;