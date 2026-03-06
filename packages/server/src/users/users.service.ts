import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly authMode: string;
  private readonly adminUsername: string;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.authMode = configService.getOrThrow<string>('AUTH_MODE');
    this.adminUsername = configService.getOrThrow<string>('BASIC_AUTH_USER');
  }

  async onModuleInit() {
    if (this.authMode !== 'single') return;

    await this.prisma.user.upsert({
      where: { userId: 'admin' },
      update: { username: this.adminUsername },
      create: { userId: 'admin', username: this.adminUsername },
    });
  }
}
