import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';

export class CreateClankerDto {
  @ApiProperty({
    description: 'Display name for the clanker',
    example: 'Claude on prod',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Adapter ID this clanker uses',
    example: 'claude-code',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  adapterId!: string;

  @ApiProperty({
    description: 'Host ID for console adapters',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @ApiProperty({
    description: 'Adapter-specific configuration driven by adapter.fields',
    required: false,
    example: { model: 'claude-4-opus' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class UpdateClankerDto extends PartialType(CreateClankerDto) {}

export class ClankerResponseDto {
  @ApiProperty({
    description: 'Clanker unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Display name for the clanker',
    example: 'Claude on prod',
  })
  name!: string;

  @ApiProperty({
    description: 'Adapter ID this clanker uses',
    example: 'claude-code',
  })
  adapterId!: string;

  @ApiProperty({
    description: 'Host ID for console adapters',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  hostId!: string | null;

  @ApiProperty({
    description:
      'Adapter-specific configuration. Secure fields are replaced with true.',
    example: { model: 'claude-4-opus' },
  })
  config!: Record<string, unknown>;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}
