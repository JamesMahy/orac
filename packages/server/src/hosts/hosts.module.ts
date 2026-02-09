import { Module } from '@nestjs/common';
import { SshModule } from '@ssh/ssh.module';
import { HostsController } from './hosts.controller';
import { HostsService } from './hosts.service';

@Module({
  imports: [SshModule],
  controllers: [HostsController],
  providers: [HostsService],
})
export class HostsModule {}
