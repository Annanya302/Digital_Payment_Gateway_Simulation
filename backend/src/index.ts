import http from 'http';
import { app } from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { socketService } from './services/socket.service.js';

const port = config.port;
const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
socketService.init(server, config.corsOrigin);

server.listen(port, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 PaySim Multi-Bank Payment Gateway Started!`);
  logger.info(`🌐 Listening on http://localhost:${port}`);
  logger.info(`⚡ Real-Time Socket.IO Active on port ${port}`);
  logger.info(`🏦 Multi-Bank Simulation: SBI, HDFC, ICICI, AXIS, PNB`);
  logger.info(`🛡️ Environment: ${config.nodeEnv}`);
  logger.info(`⚠️ SIMULATION BOUNDARY: No real funds or real bank APIs`);
  logger.info(`=======================================================`);
});
