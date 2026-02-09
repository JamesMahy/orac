import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TestConnectionDto } from '../ssh.dto';

function toDto(data: Record<string, unknown>): TestConnectionDto {
  return plainToInstance(TestConnectionDto, data);
}

function omit<T extends Record<string, unknown>>(
  obj: T,
  ...keys: string[]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k)),
  );
}

async function expectValid(data: Record<string, unknown>) {
  const errors = await validate(toDto(data));
  expect(errors).toHaveLength(0);
}

async function expectInvalid(data: Record<string, unknown>, property?: string) {
  const errors = await validate(toDto(data));
  expect(errors.length).toBeGreaterThan(0);
  if (property) {
    expect(errors.some(e => e.property === property)).toBe(true);
  }
}

const validConfig = {
  hostname: '192.168.1.100',
  username: 'root',
  password: 'secret',
};

describe('TestConnectionDto', () => {
  describe('valid inputs', () => {
    it('should accept a valid config with all fields', async () => {
      await expectValid(validConfig);
    });

    it('should accept a valid config with port', async () => {
      await expectValid({ ...validConfig, port: 2222 });
    });

    it('should accept a config without password', async () => {
      await expectValid(omit(validConfig, 'password'));
    });

    it('should accept a config without port', async () => {
      await expectValid(omit(validConfig, 'port'));
    });
  });

  describe('hostname validation', () => {
    it('should reject empty hostname', async () => {
      await expectInvalid({ ...validConfig, hostname: '' }, 'hostname');
    });

    it('should reject missing hostname', async () => {
      await expectInvalid(omit(validConfig, 'hostname'), 'hostname');
    });

    it('should reject hostname with shell metacharacters', async () => {
      await expectInvalid(
        { ...validConfig, hostname: '192.168.1.1; rm -rf /' },
        'hostname',
      );
    });

    it('should reject hostname exceeding 255 characters', async () => {
      await expectInvalid(
        { ...validConfig, hostname: 'a'.repeat(256) },
        'hostname',
      );
    });
  });

  describe('username validation', () => {
    it('should reject empty username', async () => {
      await expectInvalid({ ...validConfig, username: '' }, 'username');
    });

    it('should reject missing username', async () => {
      await expectInvalid(omit(validConfig, 'username'), 'username');
    });

    it('should reject username with shell metacharacters', async () => {
      await expectInvalid(
        { ...validConfig, username: 'root; whoami' },
        'username',
      );
    });

    it('should reject username exceeding 255 characters', async () => {
      await expectInvalid(
        { ...validConfig, username: 'a'.repeat(256) },
        'username',
      );
    });
  });

  describe('port validation', () => {
    it('should reject port below 1', async () => {
      await expectInvalid({ ...validConfig, port: 0 }, 'port');
    });

    it('should reject port above 65535', async () => {
      await expectInvalid({ ...validConfig, port: 65536 }, 'port');
    });

    it('should accept port at boundaries', async () => {
      await expectValid({ ...validConfig, port: 1 });
      await expectValid({ ...validConfig, port: 65535 });
    });
  });

  describe('password validation', () => {
    it('should reject password exceeding 4096 characters', async () => {
      await expectInvalid(
        { ...validConfig, password: 'a'.repeat(4097) },
        'password',
      );
    });
  });
});
