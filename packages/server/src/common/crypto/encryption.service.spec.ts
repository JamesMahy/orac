import { EncryptionService } from './encryption.service';

// 32 bytes = 64 hex chars
const VALID_KEY = 'a'.repeat(64);

function createService(hex: string): EncryptionService {
  const configService = {
    getOrThrow: () => hex,
  };
  return new EncryptionService(
    configService as unknown as import('@nestjs/config').ConfigService,
  );
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    service = createService(VALID_KEY);
  });

  it('should encrypt and decrypt a string', () => {
    const plaintext = 'my-secret-password';
    const encrypted = service.encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(service.decrypt(encrypted)).toBe(plaintext);
  });

  it('should produce different ciphertext for the same input', () => {
    const plaintext = 'same-input';
    const a = service.encrypt(plaintext);
    const b = service.encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it('should handle empty strings', () => {
    const encrypted = service.encrypt('');
    expect(service.decrypt(encrypted)).toBe('');
  });

  it('should handle unicode characters', () => {
    const plaintext = 'p@ssw0rd-with-unicode-\u00e9\u00e8\u00ea';
    const encrypted = service.encrypt(plaintext);
    expect(service.decrypt(encrypted)).toBe(plaintext);
  });

  it('should throw on tampered ciphertext', () => {
    const encrypted = service.encrypt('secret');
    const tampered =
      encrypted.slice(0, -2) +
      (encrypted.slice(-1) === 'A' ? 'B' : 'A') +
      encrypted.slice(-1);
    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('should throw on invalid encrypted data (too short)', () => {
    expect(() => service.decrypt('dG9vc2hvcnQ=')).toThrow(
      'Invalid encrypted data',
    );
  });

  it('should reject keys that are not 32 bytes', () => {
    expect(() => createService('abcd')).toThrow(
      'ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
    );
  });

  it('should not decrypt with a different key', () => {
    const encrypted = service.encrypt('secret');
    const otherService = createService('b'.repeat(64));
    expect(() => otherService.decrypt(encrypted)).toThrow();
  });
});
