import { Injectable, NotFoundException } from '@nestjs/common';
import { Host, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { CreateHostDto, UpdateHostDto } from './hosts.dto';

type HostResponse = Omit<Host, 'password' | 'apiKey'>;

@Injectable()
export class HostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async findAll(): Promise<HostResponse[]> {
    const hosts = await this.prisma.host.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return hosts.map(h => this.stripSensitive(h));
  }

  async findOne(id: string): Promise<HostResponse> {
    const host = await this.prisma.host.findUnique({ where: { id } });
    if (!host) {
      throw new NotFoundException('Host not found');
    }
    return this.stripSensitive(host);
  }

  async create(dto: CreateHostDto): Promise<HostResponse> {
    const data: Prisma.HostCreateInput = {
      name: dto.name,
      type: dto.type,
      hostname: dto.hostname,
      port: dto.port,
      username: dto.username,
      password:
        dto.type === 'ssh' && dto.password
          ? this.encryption.encrypt(dto.password)
          : undefined,
      endpoint: dto.endpoint,
      apiKey:
        dto.type === 'api' && dto.apiKey
          ? this.encryption.encrypt(dto.apiKey)
          : undefined,
      provider: dto.provider,
      model: dto.model,
    };

    const host = await this.prisma.host.create({ data });
    return this.stripSensitive(host);
  }

  async update(id: string, dto: UpdateHostDto): Promise<HostResponse> {
    await this.findOne(id);

    const data: Prisma.HostUpdateInput = {
      name: dto.name,
      type: dto.type,
      hostname: dto.hostname,
      port: dto.port,
      username: dto.username,
      password:
        dto.password !== undefined
          ? this.encryption.encrypt(dto.password)
          : undefined,
      endpoint: dto.endpoint,
      apiKey:
        dto.apiKey !== undefined
          ? this.encryption.encrypt(dto.apiKey)
          : undefined,
      provider: dto.provider,
      model: dto.model,
    };

    const host = await this.prisma.host.update({ where: { id }, data });
    return this.stripSensitive(host);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.host.delete({ where: { id } });
  }

  private stripSensitive(host: Host): HostResponse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, apiKey, ...rest } = host;
    return rest;
  }
}
