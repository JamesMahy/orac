import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Host, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { ClankerAdaptersService } from '@clankers/clankerAdapters.service';
import { BaseClankerAdapter } from '@clankers/base';
import {
  sanitizeObject,
  validateConfig,
  encryptSecureFields,
  maskSecureFields,
} from '@helpers/config';
import { CreateClankerDto, UpdateClankerDto } from './clankers.dto';

type ClankerResponse = {
  clankerId: string;
  name: string;
  adapter: { clankerAdapterId: string; name: string };
  host: { hostId: string; name: string } | null;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ClankersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly adapters: ClankerAdaptersService,
  ) {}

  async findAll(): Promise<ClankerResponse[]> {
    const clankers = await this.prisma.clanker.findMany({
      include: { host: true },
      orderBy: { createdAt: 'desc' },
    });
    return clankers.map(clanker => {
      const adapter = this.adapters.getAdapter(clanker.clankerAdapterId);
      return this.toResponse(clanker, adapter);
    });
  }

  async findOne(clankerId: string): Promise<ClankerResponse> {
    const clanker = await this.prisma.clanker.findUnique({
      where: { clankerId },
      include: { host: true },
    });
    if (!clanker) {
      throw new NotFoundException('clanker_not_found');
    }

    const adapter = this.adapters.getAdapter(clanker.clankerAdapterId);
    return this.toResponse(clanker, adapter);
  }

  async create(dto: CreateClankerDto): Promise<ClankerResponse> {
    const { name, clankerAdapterId, hostId, config: rawConfig } = dto;
    const adapter = this.adapters.getAdapter(clankerAdapterId);

    if (adapter.type === 'console' && !hostId) {
      throw new BadRequestException('host_id_required');
    }

    if (hostId) {
      const host = await this.prisma.host.findUnique({
        where: { hostId },
      });
      if (!host) {
        throw new NotFoundException('host_not_found');
      }
    }

    const config = sanitizeObject(rawConfig ?? {});

    validateConfig(adapter.fields, config);
    const encryptedConfig = encryptSecureFields(
      adapter.fields,
      config,
      this.encryption,
    );

    const clanker = await this.prisma.clanker.create({
      data: {
        name,
        clankerAdapterId,
        hostId: hostId ?? null,
        config: encryptedConfig as Prisma.InputJsonValue,
      },
      include: { host: true },
    });

    return this.toResponse(clanker, adapter);
  }

  async update(
    clankerId: string,
    dto: UpdateClankerDto,
  ): Promise<ClankerResponse> {
    const existing = await this.prisma.clanker.findUnique({
      where: { clankerId },
    });
    if (!existing) {
      throw new NotFoundException('clanker_not_found');
    }

    const { name, hostId, config: rawConfig } = dto;

    if (hostId) {
      const host = await this.prisma.host.findUnique({
        where: { hostId },
      });
      if (!host) {
        throw new NotFoundException('host_not_found');
      }
    }

    const adapter = this.adapters.getAdapter(existing.clankerAdapterId);

    let config: Record<string, unknown> | undefined;
    if (rawConfig !== undefined) {
      const sanitizedConfig = sanitizeObject(rawConfig);

      validateConfig(adapter.fields, sanitizedConfig);

      config = encryptSecureFields(
        adapter.fields,
        sanitizedConfig,
        this.encryption,
      );
    }

    const data: Prisma.ClankerUncheckedUpdateInput = {
      name,
      hostId: hostId !== undefined ? (hostId ?? null) : undefined,
      config: config as Prisma.InputJsonValue | undefined,
    };

    const clanker = await this.prisma.clanker.update({
      where: { clankerId },
      data,
      include: { host: true },
    });

    return this.toResponse(clanker, adapter);
  }

  async remove(clankerId: string) {
    const existing = await this.prisma.clanker.findUnique({
      where: { clankerId },
    });
    if (!existing) {
      throw new NotFoundException('clanker_not_found');
    }

    await this.prisma.clanker.delete({ where: { clankerId } });
  }

  private toResponse(
    clanker: { host: Host | null } & Prisma.ClankerGetPayload<object>,
    adapter: BaseClankerAdapter,
  ): ClankerResponse {
    const { host } = clanker;
    return {
      clankerId: clanker.clankerId,
      name: clanker.name,
      adapter: {
        clankerAdapterId: adapter.clankerAdapterId,
        name: adapter.name,
      },
      host: host ? { hostId: host.hostId, name: host.name } : null,
      config: maskSecureFields(
        adapter.fields,
        clanker.config as Record<string, unknown>,
      ),
      createdAt: clanker.createdAt,
      updatedAt: clanker.updatedAt,
    };
  }
}
