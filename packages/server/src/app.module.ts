import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from '@common/crypto/encryption.module';
import { SessionAuthGuard } from '@common/guards/session-auth.guard';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { HostsModule } from '@hosts/hosts.module';
import { SshModule } from '@ssh/ssh.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EncryptionModule,
    AuthModule,
    HostsModule,
    SshModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SessionAuthGuard,
    },
  ],
})
export class AppModule {}
