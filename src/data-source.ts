import 'reflect-metadata';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from './config/typeorm.config';
import { validateDatabaseEnvironment } from './config/env.validation';

// ConfigModule carga .env respetando las variables ya definidas en el proceso.
// El CLI no requiere JWT_SECRET porque no inicia el servidor HTTP.
export default (async () => {
  await ConfigModule.forRoot({ validate: validateDatabaseEnvironment });
  return new DataSource(databaseOptions(new ConfigService(validateDatabaseEnvironment(process.env))));
})();
