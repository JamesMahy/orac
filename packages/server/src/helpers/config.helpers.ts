import { BadRequestException } from '@nestjs/common';
import { EncryptionService } from '@common/crypto/encryption.service';

type ConfigField = {
  key: string;
  secure?: boolean;
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
};

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizeObject(
  object: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(object)) {
    if (!DANGEROUS_KEYS.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function validateConfig(
  fields: ConfigField[],
  config: Record<string, unknown>,
): void {
  for (const field of fields) {
    if (field.required && !(field.key in config)) {
      throw new BadRequestException(`field_required:${field.key}`);
    }

    if (
      field.type === 'number' &&
      field.key in config &&
      config[field.key] !== undefined
    ) {
      const value = Number(config[field.key]);

      if (isNaN(value)) {
        throw new BadRequestException(`field_invalid:${field.key}`);
      }

      if (field.min !== undefined && value < field.min) {
        throw new BadRequestException(`field_invalid:${field.key}`);
      }

      if (field.max !== undefined && value > field.max) {
        throw new BadRequestException(`field_invalid:${field.key}`);
      }
    }
  }
}

export function encryptSecureFields(
  fields: ConfigField[],
  config: Record<string, unknown>,
  encryption: EncryptionService,
): Record<string, unknown> {
  const encrypted: Record<string, unknown> = {};

  for (const field of fields) {
    if (!(field.key in config)) continue;

    const value = config[field.key];

    if (!field.secure) {
      encrypted[field.key] = value;
      continue;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`field_invalid:${field.key}`);
    }
    encrypted[field.key] = encryption.encrypt(value);
  }

  return encrypted;
}

export function decryptSecureFields(
  fields: ConfigField[],
  config: Record<string, unknown>,
  encryption: EncryptionService,
): Record<string, unknown> {
  const decrypted: Record<string, unknown> = { ...config };

  for (const field of fields) {
    if (
      field.secure &&
      field.key in decrypted &&
      decrypted[field.key] !== undefined
    ) {
      decrypted[field.key] = encryption.decrypt(
        decrypted[field.key] as string,
      );
    }
  }

  return decrypted;
}

export function maskSecureFields(
  fields: ConfigField[],
  config: Record<string, unknown>,
): Record<string, unknown> {
  const masked = { ...config };

  for (const field of fields) {
    if (field.secure && field.key in masked) {
      masked[field.key] = true;
    }
  }

  return masked;
}
