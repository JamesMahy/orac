import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from './common/crypto/encryption.module';
import { AppController } from './app.controller';
import { HostsModule } from './hosts/hosts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EncryptionModule,
    HostsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
