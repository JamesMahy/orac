import { ApiProperty } from '@nestjs/swagger';
import { PartialType, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Project ID this workspace belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  projectId!: string;

  @ApiProperty({
    description: 'Host ID this workspace connects to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  hostId!: string;

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
    description: 'Working directory path on the host',
    required: false,
    example: '/home/james/bearly-fit/exercise-service',
    maxLength: 4096,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  path?: string;
}

export class UpdateWorkspaceDto extends PartialType(
  OmitType(CreateWorkspaceDto, ['projectId', 'hostId'] as const),
) {}

export class ListWorkspacesQueryDto {
  @ApiProperty({
    description: 'Filter workspaces by project ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  projectId!: string;
}

export class WorkspaceResponseDto {
  @ApiProperty({
    description: 'Workspace unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    description: 'Project ID this workspace belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Host ID this workspace connects to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  hostId!: string;

  @ApiProperty({
    description: 'Workspace name',
    example: 'exercise-service',
  })
  name!: string;

  @ApiProperty({
    description: 'Working directory path on the host',
    nullable: true,
    example: '/home/james/bearly-fit/exercise-service',
  })
  path!: string | null;

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
