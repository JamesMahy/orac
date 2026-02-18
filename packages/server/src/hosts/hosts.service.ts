import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { Host, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma.service';
import { EncryptionService } from '@common/crypto/encryption.service';
import { SshService } from '@ssh/ssh.service';
import { CreateHostDto, UpdateHostDto } from './hosts.dto';

type HostResponse = Omit<Host, 'password' | 'apiKey'> & {
  hasPassword: boolean;
};

@Injectable()
export class HostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @Optional() private readonly sshService?: SshService,
  ) {}

  async findAll(): Promise<HostResponse[]> {
    const hosts = await this.prisma.host.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return hosts.map(host => this.toResponse(host));
  }

  async findOne(hostId: string): Promise<HostResponse> {
    const host = await this.prisma.host.findUnique({ where: { hostId } });
    if (!host) {
      throw new NotFoundException('host_not_found');
    }
    return this.toResponse(host);
  }

  async create(dto: CreateHostDto): Promise<HostResponse> {
    const {
      name, type, hostname, port, username, password,
      hostKeyFingerprint, endpoint, apiKey, provider, model,
    } = dto;
    const data: Prisma.HostCreateInput = {
      name,
      type,
      hostname,
      port,
      username,
      password:
        type === 'ssh' && password
          ? this.encryption.encrypt(password)
          : undefined,
      hostKeyFingerprint,
      endpoint,
      apiKey:
        type === 'api' && apiKey
          ? this.encryption.encrypt(apiKey)
          : undefined,
      provider,
      model,
    };

    const host = await this.prisma.host.create({ data });
    return this.toResponse(host);
  }

  async update(hostId: string, dto: UpdateHostDto): Promise<HostResponse> {
    const existing = await this.prisma.host.findUnique({ where: { hostId } });
    if (!existing) {
      throw new NotFoundException('host_not_found');
    }

    const {
      name, type, hostname, port, username, password,
      hostKeyFingerprint, endpoint, apiKey, provider, model,
    } = dto;
    const data: Prisma.HostUpdateInput = {
      name,
      type,
      hostname,
      port,
      username,
      password:
        password !== undefined
          ? password === ''
            ? null
            : this.encryption.encrypt(password)
          : undefined,
      hostKeyFingerprint,
      endpoint,
      apiKey:
        apiKey !== undefined
          ? this.encryption.encrypt(apiKey)
          : undefined,
      provider,
      model,
    };

    const host = await this.prisma.host.update({ where: { hostId }, data });
    return this.toResponse(host);
  }

  async remove(hostId: string) {
    const existing = await this.prisma.host.findUnique({ where: { hostId } });
    if (!existing) {
      throw new NotFoundException('host_not_found');
    }
    this.sshService?.disconnect(hostId);
    return this.prisma.host.delete({ where: { hostId } });
  }

  private toResponse(host: Host): HostResponse {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, apiKey, ...rest } = host;
    return { ...rest, hasPassword: !!password };
  }
}
