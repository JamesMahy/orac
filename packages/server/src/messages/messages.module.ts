import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesModule } from '@files/files.module';
import { MessagesController } from './messages.controller';
import { AttachmentsController } from './attachments.controller';
import { MessagesService } from './messages.service';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [PrismaModule, FilesModule],
  controllers: [MessagesController, AttachmentsController],
  providers: [MessagesService, AttachmentsService],
  exports: [MessagesService],
})
export class MessagesModule {}
