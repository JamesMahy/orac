import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateHostDto } from '../hosts.dto';

function toDto(data: Record<string, unknown>): CreateHostDto {
  return plainToInstance(CreateHostDto, data);
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

const validSsh = {
  name: 'My SSH Host',
  type: 'ssh',
  hostname: '192.168.1.100',
  username: 'root',
  password: 'secret',
};

const validApi = {
  name: 'My API Host',
  type: 'api',
  endpoint: 'https://api.openai.com/v1',
  apiKey: 'sk-test-key',
  provider: 'openai',
  model: 'gpt-4',
};

describe('CreateHostDto', () => {
  describe('valid inputs', () => {
    it('should accept a valid SSH host', async () => {
      await expectValid(validSsh);
    });

    it('should accept a valid SSH host with port', async () => {
      await expectValid({ ...validSsh, port: 2222 });
    });

    it('should accept a valid API host', async () => {
      await expectValid(validApi);
    });
  });

  describe('name validation', () => {
    it('should reject empty name', async () => {
      await expectInvalid({ ...validSsh, name: '' }, 'name');
    });

    it('should reject name exceeding 255 characters', async () => {
      await expectInvalid({ ...validSsh, name: 'a'.repeat(256) }, 'name');
    });

    it('should reject missing name', async () => {
      await expectInvalid(omit(validSsh, 'name'), 'name');
    });
  });

  describe('type validation', () => {
    it('should reject invalid type', async () => {
      await expectInvalid({ ...validSsh, type: 'ftp' }, 'type');
    });

    it('should reject missing type', async () => {
      await expectInvalid(omit(validSsh, 'type'), 'type');
    });
  });

  describe('SSH conditional validation', () => {
    it('should reject SSH host without hostname', async () => {
      await expectInvalid(omit(validSsh, 'hostname'), 'hostname');
    });

    it('should reject SSH host without username', async () => {
      await expectInvalid(omit(validSsh, 'username'), 'username');
    });

    it('should accept SSH host without password', async () => {
      await expectValid(omit(validSsh, 'password'));
    });

    it('should reject hostname with shell metacharacters', async () => {
      await expectInvalid(
        { ...validSsh, hostname: '192.168.1.1; rm -rf /' },
        'hostname',
      );
    });

    it('should reject username with shell metacharacters', async () => {
      await expectInvalid(
        { ...validSsh, username: 'root; whoami' },
        'username',
      );
    });

    it('should reject port below 1', async () => {
      await expectInvalid({ ...validSsh, port: 0 }, 'port');
    });

    it('should reject port above 65535', async () => {
      await expectInvalid({ ...validSsh, port: 65536 }, 'port');
    });

    it('should not require SSH fields for API type', async () => {
      await expectValid(validApi);
    });
  });

  describe('API conditional validation', () => {
    it('should reject API host without endpoint', async () => {
      await expectInvalid(omit(validApi, 'endpoint'), 'endpoint');
    });

    it('should reject API host without apiKey', async () => {
      await expectInvalid(omit(validApi, 'apiKey'), 'apiKey');
    });

    it('should reject API host without provider', async () => {
      await expectInvalid(omit(validApi, 'provider'), 'provider');
    });

    it('should reject API host without model', async () => {
      await expectInvalid(omit(validApi, 'model'), 'model');
    });

    it('should reject non-HTTPS endpoint', async () => {
      await expectInvalid(
        { ...validApi, endpoint: 'http://api.openai.com/v1' },
        'endpoint',
      );
    });

    it('should reject endpoint without protocol', async () => {
      await expectInvalid(
        { ...validApi, endpoint: 'api.openai.com/v1' },
        'endpoint',
      );
    });

    it('should not require API fields for SSH type', async () => {
      await expectValid(validSsh);
    });
  });

  describe('max length validation', () => {
    it('should reject password exceeding 4096 characters', async () => {
      await expectInvalid(
        { ...validSsh, password: 'a'.repeat(4097) },
        'password',
      );
    });

    it('should reject apiKey exceeding 4096 characters', async () => {
      await expectInvalid({ ...validApi, apiKey: 'a'.repeat(4097) }, 'apiKey');
    });
  });
});
