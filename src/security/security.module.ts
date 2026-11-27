import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [UsersModule, ConfigModule, JwtModule.register({})],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [UsersModule, JwtAuthGuard, RolesGuard, JwtModule, ConfigModule],
})
export class SecurityModule {}
