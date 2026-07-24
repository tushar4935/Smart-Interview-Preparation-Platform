const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const logger = require('./config/logger');
const app = require('./app');

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
})();

// keep the process from dying silently on an unhandled rejection
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});
