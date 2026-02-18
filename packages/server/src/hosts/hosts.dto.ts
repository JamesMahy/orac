import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import {
  IsIn,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsUrl,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHostDto {
  @ApiProperty({
    description: 'Display name for the host',
    example: 'My Server',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Host connection type',
    enum: ['ssh', 'api'],
    example: 'ssh',
  })
  @IsIn(['ssh', 'api'])
  type!: 'ssh' | 'api';

  // SSH fields

  @ApiProperty({
    description:
      'Hostname or IP address of the SSH server. Required when type is "ssh".',
    required: false,
    example: '192.168.1.100',
    maxLength: 255,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'ssh')
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'hostname must contain only alphanumeric characters, dots, hyphens, and underscores',
  })
  hostname?: string;

  @ApiProperty({
    description:
      'SSH port number. Required when type is "ssh". Defaults to 22.',
    required: false,
    example: 22,
    default: 22,
    minimum: 1,
    maximum: 65535,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'ssh')
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiProperty({
    description: 'SSH username. Required when type is "ssh".',
    required: false,
    example: 'root',
    maxLength: 255,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'ssh')
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._@+-]+$/, {
    message:
      'username must contain only alphanumeric characters, dots, hyphens, underscores, @ and +',
  })
  username?: string;

  @ApiProperty({
    description:
      'SSH password. Optional — omit if using key-based or no authentication.',
    required: false,
    example: 'secret',
    maxLength: 4096,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'ssh')
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  password?: string;

  @ApiProperty({
    description:
      'SSH host key fingerprint (SHA256). Optional — set after user confirms the fingerprint.',
    required: false,
    example: 'SHA256:abc123def456...',
    maxLength: 255,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'ssh')
  @IsOptional()
  @IsString()
  @MaxLength(255)
  hostKeyFingerprint?: string;

  // API fields

  @ApiProperty({
    description:
      'HTTPS endpoint URL of the API provider. Required when type is "api".',
    required: false,
    example: 'https://api.openai.com/v1',
    maxLength: 255,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'api')
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(255)
  endpoint?: string;

  @ApiProperty({
    description:
      'API key for authentication. Required when type is "api". Stored encrypted.',
    required: false,
    example: 'sk-example-key-12345',
    maxLength: 4096,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'api')
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  apiKey?: string;

  @ApiProperty({
    description: 'API provider name. Required when type is "api".',
    required: false,
    example: 'openai',
    maxLength: 100,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'api')
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  provider?: string;

  @ApiProperty({
    description: 'AI model identifier. Required when type is "api".',
    required: false,
    example: 'gpt-4',
    maxLength: 100,
  })
  @ValidateIf((o: CreateHostDto) => o.type === 'api')
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model?: string;
}

export class UpdateHostDto extends PartialType(CreateHostDto) {}

export class HostResponseDto {
  @ApiProperty({
    description: 'Host unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  hostId!: string;

  @ApiProperty({
    description: 'Display name for the host',
    example: 'My Server',
  })
  name!: string;

  @ApiProperty({
    description: 'Host connection type',
    enum: ['ssh', 'api'],
    example: 'ssh',
  })
  type!: string;

  @ApiProperty({
    description: 'SSH hostname or IP address',
    nullable: true,
    example: '192.168.1.100',
  })
  hostname!: string | null;

  @ApiProperty({ description: 'SSH port number', nullable: true, example: 22 })
  port!: number | null;

  @ApiProperty({ description: 'SSH username', nullable: true, example: 'root' })
  username!: string | null;

  @ApiProperty({
    description: 'SSH host key fingerprint (SHA256)',
    nullable: true,
    required: false,
    example: 'SHA256:abc123def456...',
  })
  hostKeyFingerprint!: string | null;

  @ApiProperty({
    description: 'API endpoint URL',
    nullable: true,
    example: 'https://api.openai.com/v1',
  })
  endpoint!: string | null;

  @ApiProperty({
    description: 'API provider name',
    nullable: true,
    example: 'openai',
  })
  provider!: string | null;

  @ApiProperty({
    description: 'AI model identifier',
    nullable: true,
    example: 'gpt-4',
  })
  model!: string | null;

  @ApiProperty({
    description: 'Whether the host has a stored SSH password',
    example: false,
  })
  hasPassword!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}
