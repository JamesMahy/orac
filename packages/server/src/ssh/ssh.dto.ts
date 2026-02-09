import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUUID,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TestConnectionDto {
  @ApiProperty({
    description:
      'ID of an existing host. When provided and no password is sent, the stored password is used.',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @ApiProperty({
    description: 'Hostname or IP address of the SSH server',
    example: '192.168.1.100',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'hostname must contain only alphanumeric characters, dots, hyphens, and underscores',
  })
  hostname!: string;

  @ApiProperty({
    description: 'SSH port number. Defaults to 22.',
    required: false,
    example: 22,
    default: 22,
    minimum: 1,
    maximum: 65535,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiProperty({
    description: 'SSH username',
    example: 'root',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^[a-zA-Z0-9._@+-]+$/, {
    message:
      'username must contain only alphanumeric characters, dots, hyphens, underscores, @ and +',
  })
  username!: string;

  @ApiProperty({
    description: 'SSH password. Optional for key-based authentication.',
    required: false,
    example: 'secret',
    maxLength: 4096,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  password?: string;
}

export class TestConnectionResponseDto {
  @ApiProperty({
    description: 'Whether the connection was successful',
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    description: 'Human-readable status message',
    required: false,
    example: 'Connection successful',
  })
  message?: string;

  @ApiProperty({
    description: 'SSH host key fingerprint (SHA256)',
    required: false,
    example: 'SHA256:abc123def456...',
  })
  fingerprint?: string;
}

export class ConnectionStatusDto {
  @ApiProperty({
    description: 'Host unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  hostId!: string;

  @ApiProperty({
    description: 'Current connection status',
    enum: ['connected', 'connecting', 'disconnected', 'error'],
    example: 'disconnected',
  })
  status!: string;

  @ApiProperty({
    description: 'Additional status message',
    required: false,
    example: 'Connection refused',
  })
  message?: string;
}
