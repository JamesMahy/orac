import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Clanker, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { AdaptersService } from '@adapters/adapters.service';
import { BaseAdapter } from '@adapters/base';
import { sanitizeObject } from '../helpers';
import { CreateClankerDto, UpdateClankerDto } from './clankers.dto';

type ClankerResponse = {
  id: string;
  name: string;
  adapterId: string;
  hostId: string | null;
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
      orderBy: { createdAt: 'desc' },
    });
    return clankers.map(clanker => {
      const adapter = this.adapters.getAdapter(clanker.adapterId);
      return this.toResponse(clanker, adapter);
    });
  }

  async findOne(id: string): Promise<ClankerResponse> {
    const clanker = await this.prisma.clanker.findUnique({ where: { id } });
    if (!clanker) {
      throw new NotFoundException('clanker_not_found');
    }
    const adapter = this.adapters.getAdapter(clanker.adapterId);
    return this.toResponse(clanker, adapter);
  }

  async create(dto: CreateClankerDto): Promise<ClankerResponse> {
    const adapter = this.adapters.getAdapter(dto.adapterId);

    if (adapter.type === 'console') {
      if (!dto.hostId) {
        throw new BadRequestException('host_id_required');
      }
      const host = await this.prisma.host.findUnique({
        where: { id: dto.hostId },
      });
      if (!host) {
        throw new NotFoundException('host_not_found');
      }
    }

    const config = sanitizeObject(dto.config ?? {});
    this.validateConfig(adapter, config);
    const encryptedConfig = this.encryptConfig(adapter, config);

    const clanker = await this.prisma.clanker.create({
      data: {
        name: dto.name,
        adapterId: dto.adapterId,
        hostId: dto.hostId ?? null,
        config: encryptedConfig as Prisma.InputJsonValue,
      },
    });

    return this.toResponse(clanker, adapter);
  }

  async update(id: string, dto: UpdateClankerDto): Promise<ClankerResponse> {
    const existing = await this.prisma.clanker.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('clanker_not_found');
    }

    const adapterId = dto.adapterId ?? existing.adapterId;
    const adapter = this.adapters.getAdapter(adapterId);

    if (dto.hostId !== undefined) {
      if (adapter.type === 'console') {
        const host = await this.prisma.host.findUnique({
          where: { id: dto.hostId },
        });
        if (!host) {
          throw new NotFoundException('host_not_found');
        }
      }
    }

    let config: Record<string, unknown> | undefined;
    if (dto.config !== undefined) {
      const sanitizedConfig = sanitizeObject(dto.config);
      this.validateConfig(adapter, sanitizedConfig);
      config = this.encryptConfig(adapter, sanitizedConfig);
    }

    const data: Prisma.ClankerUncheckedUpdateInput = {
      name: dto.name,
      adapterId: dto.adapterId,
      hostId: dto.hostId !== undefined ? (dto.hostId ?? null) : undefined,
      config: config as Prisma.InputJsonValue | undefined,
    };

    const clanker = await this.prisma.clanker.update({
      where: { id },
      data,
    });

    return this.toResponse(clanker, adapter);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.clanker.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('clanker_not_found');
    }
    await this.prisma.clanker.delete({ where: { id } });
  }

  private validateConfig(
    adapter: BaseAdapter,
    config: Record<string, unknown>,
  ): void {
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

  private toResponse(clanker: Clanker, adapter: BaseAdapter): ClankerResponse {
    return {
      id: clanker.id,
      name: clanker.name,
      adapterId: clanker.adapterId,
      hostId: clanker.hostId,
      config: this.maskSecureFields(
        adapter,
        clanker.config as Record<string, unknown>,
      ),
      createdAt: clanker.createdAt,
      updatedAt: clanker.updatedAt,
    };
  }
}
