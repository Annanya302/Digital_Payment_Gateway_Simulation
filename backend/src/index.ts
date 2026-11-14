import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const port = config.port;

app.listen(port, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 Digital Payment Gateway Simulation Backend Started!`);
  logger.info(`🌐 Listening on http://localhost:${port}`);
  logger.info(`🛡️ Environment: ${config.nodeEnv}`);
  logger.info(`⚠️ SIMULATION BOUNDARY: No real funds or real bank APIs`);
  logger.info(`=======================================================`);
});
