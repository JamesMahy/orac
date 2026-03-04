import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateVaultDto {
  @ApiProperty({
    description: 'Display name for the vault',
    example: 'Primary RustFS',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Vault adapter ID this vault uses',
    example: 's3',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  vaultAdapterId!: string;

  @ApiProperty({
    description: 'Adapter-specific configuration driven by adapter.fields',
    required: false,
    example: { endpoint: 'http://localhost:9000', bucket: 'orac' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateVaultDto {
  @ApiProperty({
    description: 'Display name for the vault',
    required: false,
    example: 'Primary RustFS',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Adapter-specific configuration driven by adapter.fields',
    required: false,
    example: { endpoint: 'http://localhost:9000', bucket: 'orac' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class VaultAdapterFieldDto {
  @ApiProperty({ description: 'Field key', example: 'endpoint' })
  key!: string;

  @ApiProperty({ description: 'Display label', example: 'Endpoint URL' })
  label!: string;

  @ApiProperty({
    description: 'Input type',
    enum: ['text', 'number', 'select'],
    example: 'text',
  })
  type!: 'text' | 'number' | 'select';

  @ApiProperty({ description: 'Whether the field is required', example: true })
  required!: boolean;

  @ApiProperty({
    description: 'Whether the field value should be encrypted and masked',
    required: false,
    example: false,
  })
  secure?: boolean;

  @ApiProperty({
    description: 'Default value',
    required: false,
    example: 'us-east-1',
  })
  default?: string;
}

export class VaultAdapterDefinitionDto {
  @ApiProperty({
    description: 'Unique vault adapter identifier',
    example: 's3',
  })
  vaultAdapterId!: string;

  @ApiProperty({ description: 'Display name', example: 'S3 Compatible' })
  name!: string;

  @ApiProperty({
    description: 'Configuration fields for this adapter',
    type: [VaultAdapterFieldDto],
  })
  fields!: VaultAdapterFieldDto[];
}

export class VaultResponseDto {
  @ApiProperty({
    description: 'Vault unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  vaultId!: string;

  @ApiProperty({
    description: 'Display name for the vault',
    example: 'Primary RustFS',
  })
  name!: string;

  @ApiProperty({
    description: 'Vault adapter this vault uses',
    example: 's3',
  })
  vaultAdapterId!: string;

  @ApiProperty({
    description:
      'Adapter-specific configuration. Secure fields are replaced with true.',
    example: { endpoint: 'http://localhost:9000', bucket: 'orac' },
  })
  config!: Record<string, unknown>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt!: Date;
}
