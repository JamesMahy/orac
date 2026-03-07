import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class MessagesQueryDto {
  @ApiProperty({
    description: 'Maximum number of messages to return',
    required: false,
    minimum: 1,
    maximum: 100,
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Return messages older than this message ID (cursor)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('7')
  before?: string;
}

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content', example: 'Hello!' })
  @IsString()
  content!: string;

  @ApiProperty({
    description: 'Target clanker ID to send this message to',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('7')
  targetClankerId?: string;

  @ApiProperty({
    description: 'Attachment IDs to link to this message',
    required: false,
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('7', { each: true })
  attachmentIds?: string[];
}

export class AttachmentResponseDto {
  @ApiProperty({
    description: 'Attachment unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  attachmentId!: string;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'architecture-diagram.png',
  })
  filename!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/png',
  })
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 204800 })
  size!: number;

  @ApiProperty({
    description: 'Internal storage key used to retrieve the file',
    example: 'ws-uuid/file-uuid/architecture-diagram.png',
  })
  storageKey!: string;

  @ApiProperty({
    description: 'Timestamp when the attachment was uploaded',
    example: '2026-03-06T21:00:00.000Z',
  })
  createdAt!: Date;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Message unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  messageId!: string;

  @ApiProperty({
    description: 'Workspace this message belongs to',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  workspaceId!: string;

  @ApiProperty({
    description:
      'ID of the user who sent this message, null if sent by a clanker',
    required: false,
    nullable: true,
    example: 'admin',
  })
  userId!: string | null;

  @ApiProperty({
    description:
      'ID of the clanker that sent this message, null if sent by a user',
    required: false,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  clankerId!: string | null;

  @ApiProperty({
    description:
      'ID of the clanker this message is directed to, null if not targeted',
    required: false,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  targetClankerId!: string | null;

  @ApiProperty({
    description: 'Display name of the sender',
    example: 'Alice',
  })
  senderName!: string;

  @ApiProperty({ description: 'Message role', example: 'user' })
  role!: string;

  @ApiProperty({
    description: 'Message text content',
    example: 'Can you review this file?',
  })
  content!: string;

  @ApiProperty({
    description: 'Tool call data from the adapter, null if none',
    nullable: true,
    example: null,
  })
  toolCalls!: unknown;

  @ApiProperty({
    description: 'Raw adapter stream events, null until processing completes',
    nullable: true,
    example: null,
  })
  rawEvents!: unknown;

  @ApiProperty({
    description: 'Message processing status',
    example: 'complete',
  })
  status!: string;

  @ApiProperty({
    description: 'Timestamp when the message was created',
    example: '2026-03-06T21:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Attachments linked to this message',
    type: [AttachmentResponseDto],
  })
  attachments!: AttachmentResponseDto[];
}

export class MessagesPageDto {
  @ApiProperty({
    description: 'Messages ordered newest first',
    type: [MessageResponseDto],
  })
  messages!: MessageResponseDto[];

  @ApiProperty({
    description: 'Whether older messages exist beyond this page',
    example: true,
  })
  hasMore!: boolean;
}

export class AttachmentContentResponseDto {
  @ApiProperty({
    description: 'Attachment unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  attachmentId!: string;

  @ApiProperty({
    description: 'Original filename of the uploaded file',
    example: 'architecture-diagram.png',
  })
  filename!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/png',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'Base64-encoded file content',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  content!: string;
}
