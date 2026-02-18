import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Bearly Fit',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Fitness tracking application',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectResponseDto {
  @ApiProperty({
    description: 'Project unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  projectId!: string;

  @ApiProperty({
    description: 'Project name',
    example: 'Bearly Fit',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example: 'Fitness tracking application',
  })
  description!: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;
}
