import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateClankerDto } from '../clankers.dto';

function toDto(data: Record<string, unknown>): CreateClankerDto {
  return plainToInstance(CreateClankerDto, data);
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
    expect(errors.some(error => error.property === property)).toBe(true);
  }
}

const validConsole = {
  name: 'Claude on prod',
  adapterId: 'claude-code',
  hostId: '550e8400-e29b-41d4-a716-446655440000',
};

const validApi = {
  name: 'OpenAI GPT-4',
  adapterId: 'openai-api',
  config: { apiKey: 'sk-test', model: 'gpt-4' },
};

describe('CreateClankerDto', () => {
  describe('valid inputs', () => {
    it('should accept a valid console clanker', async () => {
      await expectValid(validConsole);
    });

    it('should accept a valid API clanker', async () => {
      await expectValid(validApi);
    });

    it('should accept a clanker without hostId', async () => {
      await expectValid(omit(validConsole, 'hostId'));
    });

    it('should accept a clanker without config', async () => {
      await expectValid(omit(validApi, 'config'));
    });
  });

  describe('name validation', () => {
    it('should reject empty name', async () => {
      await expectInvalid({ ...validConsole, name: '' }, 'name');
    });

    it('should reject name exceeding 255 characters', async () => {
      await expectInvalid({ ...validConsole, name: 'a'.repeat(256) }, 'name');
    });

    it('should reject missing name', async () => {
      await expectInvalid(omit(validConsole, 'name'), 'name');
    });
  });

  describe('adapterId validation', () => {
    it('should reject empty adapterId', async () => {
      await expectInvalid({ ...validConsole, adapterId: '' }, 'adapterId');
    });

    it('should reject adapterId exceeding 100 characters', async () => {
      await expectInvalid(
        { ...validConsole, adapterId: 'a'.repeat(101) },
        'adapterId',
      );
    });

    it('should reject missing adapterId', async () => {
      await expectInvalid(omit(validConsole, 'adapterId'), 'adapterId');
    });
  });

  describe('hostId validation', () => {
    it('should reject non-UUID hostId', async () => {
      await expectInvalid({ ...validConsole, hostId: 'not-a-uuid' }, 'hostId');
    });
  });

  describe('config validation', () => {
    it('should reject non-object config', async () => {
      await expectInvalid({ ...validApi, config: 'not-an-object' }, 'config');
    });
  });
});
