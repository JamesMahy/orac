import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Host, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { AdaptersService } from '@adapters/adapters.service';
import { BaseAdapter } from '@adapters/base';
import { sanitizeObject } from '../helpers';
import { CreateClankerDto, UpdateClankerDto } from './clankers.dto';

type ClankerResponse = {
  clankerId: string;
  name: string;
  adapter: { adapterId: string; name: string };
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
    private readonly adapters: AdaptersService,
  ) {}

  async findAll(): Promise<ClankerResponse[]> {
    const clankers = await this.prisma.clanker.findMany({
      include: { host: true },
      orderBy: { createdAt: 'desc' },
    });
    return clankers.map(clanker => {
      const adapter = this.adapters.getAdapter(clanker.adapterId);
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
    const adapter = this.adapters.getAdapter(clanker.adapterId);
    return this.toResponse(clanker, adapter);
  }

  async create(dto: CreateClankerDto): Promise<ClankerResponse> {
    const { name, adapterId, hostId, config: rawConfig } = dto;
    const adapter = this.adapters.getAdapter(adapterId);

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
    this.validateConfig(adapter, config);
    const encryptedConfig = this.encryptConfig(adapter, config);

    const clanker = await this.prisma.clanker.create({
      data: {
        name,
        adapterId,
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

    const adapter = this.adapters.getAdapter(existing.adapterId);

    let config: Record<string, unknown> | undefined;
    if (rawConfig !== undefined) {
      const sanitizedConfig = sanitizeObject(rawConfig);
      this.validateConfig(adapter, sanitizedConfig);
      config = this.encryptConfig(adapter, sanitizedConfig);
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
    return this.prisma.clanker.delete({ where: { clankerId } });
  }

  private validateConfig(
    adapter: BaseAdapter,
    config: Record<string, unknown>,
  ) {
    for (const field of adapter.fields) {
      if (field.required && !(field.key in config)) {
        throw new BadRequestException(`field_required:${field.key}`);
      }
      if (
        field.type === 'number' &&
        field.key in config &&
        config[field.key] !== undefined
      ) {
        const value = Number(config[field.key]);

        if (isNaN(value)) {
          throw new BadRequestException(`field_invalid:${field.key}`);
        }

        if (field.min !== undefined && value < field.min) {
          throw new BadRequestException(`field_invalid:${field.key}`);
        }

        if (field.max !== undefined && value > field.max) {
          throw new BadRequestException(`field_invalid:${field.key}`);
        }
      }
    }
  }

  private encryptConfig(
    adapter: BaseAdapter,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    const encrypted: Record<string, unknown> = {};
    for (const field of adapter.fields) {
      if (!(field.key in config)) continue;

      const value = config[field.key];

      if (!field.secure) {
        encrypted[field.key] = value;
        continue;
      }

      if (typeof value !== 'string') {
        throw new BadRequestException(`field_invalid:${field.key}`);
      }
      encrypted[field.key] = this.encryption.encrypt(value);
    }
    return encrypted;
  }

  private maskSecureFields(
    adapter: BaseAdapter,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    const stripped = { ...config };
    for (const field of adapter.fields) {
      if (field.secure && field.key in stripped) {
        stripped[field.key] = true;
      }
    }
    return stripped;
  }

  private toResponse(
    clanker: { host: Host | null } & Prisma.ClankerGetPayload<object>,
    adapter: BaseAdapter,
  ): ClankerResponse {
    const { host } = clanker;
    return {
      clankerId: clanker.clankerId,
      name: clanker.name,
      adapter: { adapterId: adapter.adapterId, name: adapter.name },
      host: host ? { hostId: host.hostId, name: host.name } : null,
      config: this.maskSecureFields(
        adapter,
        clanker.config as Record<string, unknown>,
      ),
      createdAt: clanker.createdAt,
      updatedAt: clanker.updatedAt,
    };
  }
}
