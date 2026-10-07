require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`
🚀 =================================================== 🚀
   USER MANAGEMENT SYSTEM RESTful API IS RUNNING
   
   🌐 Server URL:        http://localhost:${PORT}
   📊 Visual Dashboard:  http://localhost:${PORT}/
   🔐 Basic Auth Admin:  ${process.env.BASIC_AUTH_USER || 'admin'} / ${process.env.BASIC_AUTH_PASS || 'admin123'}
   📡 API Endpoints:     http://localhost:${PORT}/api/users
🚀 =================================================== 🚀
      `);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`❌ Unhandled Rejection Error: ${err.message}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
