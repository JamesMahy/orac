import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users.service';
import { PrismaService } from '@database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { upsert: jest.Mock } };

  function buildModule(authMode: string) {
    return Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) =>
              ({ AUTH_MODE: authMode, BASIC_AUTH_USER: 'testuser' })[key],
          },
        },
      ],
    }).compile();
  }

  beforeEach(() => {
    prisma = { user: { upsert: jest.fn().mockResolvedValue(undefined) } };
  });

  describe('onModuleInit', () => {
    it('should upsert admin user in single-user mode', async () => {
      const module: TestingModule = await buildModule('single');
      service = module.get<UsersService>(UsersService);

      await service.onModuleInit();

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { userId: 'admin' },
        update: { username: 'testuser' },
        create: { userId: 'admin', username: 'testuser' },
      });
    });

    it('should not upsert in multi-user mode', async () => {
      const module: TestingModule = await buildModule('multi');
      service = module.get<UsersService>(UsersService);

      await service.onModuleInit();

      expect(prisma.user.upsert).not.toHaveBeenCalled();
    });
  });
});
