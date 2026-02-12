import { app } from './app';
import { env } from './config/env';
import { logger } from './core/logger/logger';

app.listen(env.port, () => {
  logger.info(`ISMP backend started on port ${env.port}`);
});
