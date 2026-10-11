import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule, ConfigModule],
})
export class SecurityModule {}
