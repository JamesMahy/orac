import { ApiProperty } from '@nestjs/swagger';

export class AdapterCommandDto {
  @ApiProperty({
    description: 'Command string',
    example: '/review',
  })
  command!: string;

  @ApiProperty({
    description: 'What the command does',
    example: 'Review code changes',
  })
  description!: string;
}

export class AdapterFieldDto {
  @ApiProperty({ description: 'Field key', example: 'apiKey' })
  key!: string;

  @ApiProperty({ description: 'Display label', example: 'API Key' })
  label!: string;

  @ApiProperty({
    description: 'Input type',
    enum: ['text', 'number', 'textarea', 'select'],
    example: 'text',
  })
  type!: string;

  @ApiProperty({ description: 'Whether the field is required', example: true })
  required!: boolean;

  @ApiProperty({
    description: 'Whether the field value should be encrypted and masked',
    required: false,
    example: true,
  })
  secure?: boolean;

  @ApiProperty({
    description: 'Options for select fields',
    required: false,
    type: [String],
  })
  options?: string[];

  @ApiProperty({
    description: 'Default value',
    required: false,
  })
  default?: string;

  @ApiProperty({
    description: 'Minimum value for number fields',
    required: false,
  })
  min?: number;

  @ApiProperty({
    description: 'Maximum value for number fields',
    required: false,
  })
  max?: number;

  @ApiProperty({
    description: 'Step increment for number fields',
    required: false,
  })
  step?: number;
}

export class AdapterDefinitionDto {
  @ApiProperty({
    description: 'Unique adapter identifier',
    example: 'claude-code',
  })
  adapterId!: string;

  @ApiProperty({
    description: 'Display name',
    example: 'Claude Code',
  })
  name!: string;

  @ApiProperty({
    description: 'Adapter type',
    enum: ['console', 'api'],
    example: 'console',
  })
  type!: string;

  @ApiProperty({
    description: 'CLI command for console adapters',
    nullable: true,
    example: 'claude',
  })
  command!: string | null;

  @ApiProperty({
    description: 'Adapter capabilities',
    type: [String],
    example: ['filesystem', 'code_execution', 'tool_use', 'streaming'],
  })
  capabilities!: string[];

  @ApiProperty({
    description: 'Supported commands',
    type: [AdapterCommandDto],
  })
  commands!: AdapterCommandDto[];

  @ApiProperty({
    description: 'Configuration fields for API adapters',
    type: [AdapterFieldDto],
  })
  fields!: AdapterFieldDto[];

  @ApiProperty({
    description: 'Default API endpoint for API adapters',
    nullable: true,
    example: null,
  })
  defaultEndpoint!: string | null;

  @ApiProperty({
    description:
      'Session strategy - managed (adapter manages sessions) or unmanaged (replay full history)',
    enum: ['managed', 'unmanaged'],
    example: 'managed',
  })
  sessionStrategy!: string;
}
