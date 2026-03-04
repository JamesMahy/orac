import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { EncryptionModule } from '@common/crypto/encryption.module';
import { SessionAuthGuard } from '@common/guards/session-auth.guard';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { HostsModule } from '@hosts/hosts.module';
import { ProjectsModule } from '@projects/projects.module';
import { WorkspacesModule } from '@workspaces/workspaces.module';
import { SshModule } from '@ssh/ssh.module';
import { ClankersModule } from '@clankers/clankers.module';
import { VaultsModule } from '@vaults/vaults.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    EncryptionModule,
    AuthModule,
    HostsModule,
    ProjectsModule,
    WorkspacesModule,
    SshModule,
    ClankersModule,
    VaultsModule,
    FilesModule,
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
