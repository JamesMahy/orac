import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Project ID this workspace belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  projectId!: string;

  @ApiProperty({
    description: 'Workspace name',
    example: 'exercise-service',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Primary clanker ID for this workspace',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  primaryClankerId!: string;

  @ApiProperty({
    description: 'Host ID for filesystem context (optional)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  hostId?: string;

  @ApiProperty({
    description: 'Working directory path on the host',
    required: false,
    example: '/home/james/bearly-fit/exercise-service',
    maxLength: 4096,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  path?: string;

  @ApiProperty({
    description: 'Clankers to invite to this workspace on creation',
    required: false,
    type: () => [AddWorkspaceClankerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddWorkspaceClankerDto)
  clankers?: AddWorkspaceClankerDto[];
}

export class UpdateWorkspaceDto {
  @ApiProperty({
    description: 'Workspace name',
    required: false,
    example: 'updated-service',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Working directory path on the host',
    required: false,
    nullable: true,
    example: '/home/james/bearly-fit/exercise-service',
    maxLength: 4096,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  path?: string;

  @ApiProperty({
    description: 'Host ID for filesystem context (null to clear)',
    required: false,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  hostId?: string | null;

  @ApiProperty({
    description: 'Primary clanker ID for this workspace',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  primaryClankerId?: string;

  @ApiProperty({
    description:
      'Currently active clanker ID (null to reset to primary)',
    required: false,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  currentClankerId?: string | null;
}

export class ListWorkspacesQueryDto {
  @ApiProperty({
    description: 'Filter workspaces by project ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  projectId!: string;
}

class WorkspaceClankerDto {
  @ApiProperty({
    description: 'Clanker unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  clankerId!: string;

  @ApiProperty({
    description: 'Clanker name',
    example: 'Claude Code',
  })
  name!: string;

  @ApiProperty({
    description: 'Model override for this workspace (null = use clanker default)',
    nullable: true,
    example: 'claude-opus-4-6',
  })
  modelOverride!: string | null;

  @ApiProperty({
    description:
      'Temperature override for this workspace (null = use clanker default)',
    nullable: true,
    example: 0.7,
  })
  temperatureOverride!: number | null;
}

export class WorkspaceResponseDto {
  @ApiProperty({
    description: 'Workspace unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  workspaceId!: string;

  @ApiProperty({
    description: 'Project ID this workspace belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Workspace name',
    example: 'exercise-service',
  })
  name!: string;

  @ApiProperty({
    description: 'Host ID for filesystem context',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  hostId!: string | null;

  @ApiProperty({
    description: 'Working directory path on the host',
    nullable: true,
    example: '/home/james/bearly-fit/exercise-service',
  })
  path!: string | null;

  @ApiProperty({
    description: 'Primary clanker ID',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  primaryClankerId!: string | null;

  @ApiProperty({
    description: 'Primary clanker details',
    nullable: true,
    type: WorkspaceClankerDto,
  })
  primaryClanker!: { clankerId: string; name: string } | null;

  @ApiProperty({
    description: 'Currently active clanker ID (null = use primary)',
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  currentClankerId!: string | null;

  @ApiProperty({
    description: 'Invited clankers in this workspace',
    type: [WorkspaceClankerDto],
  })
  clankers!: WorkspaceClankerDto[];

  @ApiProperty({
    description: 'Active session identifier',
    nullable: true,
  })
  sessionId!: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}

export class AddWorkspaceClankerDto {
  @ApiProperty({
    description: 'Clanker ID to invite to this workspace',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  clankerId!: string;

  @ApiProperty({
    description: 'Model override for this workspace (null = use clanker default)',
    required: false,
    example: 'claude-opus-4-6',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelOverride?: string;

  @ApiProperty({
    description: 'Temperature override for this workspace (0–2)',
    required: false,
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperatureOverride?: number;
}
