import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionController } from './session.controller';
import { JwtStrategy } from './jwt.strategy';
import { SessionService } from './session.service';
import { RateLimitService } from './rate-limit.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'systematic-web-secret-key',
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '24h' },
    }),
  ],
  controllers: [AuthController, SessionController],
  providers: [AuthService, JwtStrategy, SessionService, RateLimitService],
  exports: [AuthService, SessionService, RateLimitService],
})
export class AuthModule {}
