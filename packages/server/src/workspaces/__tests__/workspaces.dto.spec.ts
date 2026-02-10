import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ListWorkspacesQueryDto,
} from '../workspaces.dto';

function toCreateDto(data: Record<string, unknown>): CreateWorkspaceDto {
  return plainToInstance(CreateWorkspaceDto, data);
}

function toUpdateDto(data: Record<string, unknown>): UpdateWorkspaceDto {
  return plainToInstance(UpdateWorkspaceDto, data);
}

function toQueryDto(data: Record<string, unknown>): ListWorkspacesQueryDto {
  return plainToInstance(ListWorkspacesQueryDto, data);
}

function omit<T extends Record<string, unknown>>(
  obj: T,
  ...keys: string[]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key)),
  );
}

async function expectValid(data: Record<string, unknown>) {
  const errors = await validate(toCreateDto(data));
  expect(errors).toHaveLength(0);
}

async function expectInvalid(data: Record<string, unknown>, property?: string) {
  const errors = await validate(toCreateDto(data));
  expect(errors.length).toBeGreaterThan(0);
  if (property) {
    expect(errors.some(error => error.property === property)).toBe(true);
  }
}

const validWorkspace = {
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  hostId: '660e8400-e29b-41d4-a716-446655440000',
  name: 'exercise-service',
  path: '/home/james/bearly-fit/exercise-service',
};

describe('CreateWorkspaceDto', () => {
  describe('valid inputs', () => {
    it('should accept a valid workspace', async () => {
      await expectValid(validWorkspace);
    });

    it('should accept a workspace without path', async () => {
      await expectValid(omit(validWorkspace, 'path'));
    });
  });

  describe('projectId validation', () => {
    it('should reject missing projectId', async () => {
      await expectInvalid(omit(validWorkspace, 'projectId'), 'projectId');
    });

    it('should reject non-UUID projectId', async () => {
      await expectInvalid(
        { ...validWorkspace, projectId: 'not-a-uuid' },
        'projectId',
      );
    });
  });

  describe('hostId validation', () => {
    it('should reject missing hostId', async () => {
      await expectInvalid(omit(validWorkspace, 'hostId'), 'hostId');
    });

    it('should reject non-UUID hostId', async () => {
      await expectInvalid(
        { ...validWorkspace, hostId: 'not-a-uuid' },
        'hostId',
      );
    });
  });

  describe('name validation', () => {
    it('should reject empty name', async () => {
      await expectInvalid({ ...validWorkspace, name: '' }, 'name');
    });

    it('should reject name exceeding 255 characters', async () => {
      await expectInvalid({ ...validWorkspace, name: 'a'.repeat(256) }, 'name');
    });

    it('should reject missing name', async () => {
      await expectInvalid(omit(validWorkspace, 'name'), 'name');
    });
  });

  describe('path validation', () => {
    it('should accept path as optional', async () => {
      await expectValid(omit(validWorkspace, 'path'));
    });

    it('should reject path exceeding 4096 characters', async () => {
      await expectInvalid(
        { ...validWorkspace, path: 'a'.repeat(4097) },
        'path',
      );
    });
  });
});

describe('UpdateWorkspaceDto', () => {
  it('should accept name only', async () => {
    const errors = await validate(toUpdateDto({ name: 'new-name' }));
    expect(errors).toHaveLength(0);
  });

  it('should accept path only', async () => {
    const errors = await validate(toUpdateDto({ path: '/new/path' }));
    expect(errors).toHaveLength(0);
  });

  it('should accept empty object', async () => {
    const errors = await validate(toUpdateDto({}));
    expect(errors).toHaveLength(0);
  });

  it('should not validate projectId in update', async () => {
    const errors = await validate(
      toUpdateDto({ projectId: 'not-a-uuid', name: 'new-name' }),
    );
    expect(errors.every(error => error.property !== 'projectId')).toBe(true);
  });

  it('should not validate hostId in update', async () => {
    const errors = await validate(
      toUpdateDto({ hostId: 'not-a-uuid', name: 'new-name' }),
    );
    expect(errors.every(error => error.property !== 'hostId')).toBe(true);
  });
});

describe('ListWorkspacesQueryDto', () => {
  it('should accept a valid UUID projectId', async () => {
    const errors = await validate(
      toQueryDto({ projectId: '550e8400-e29b-41d4-a716-446655440000' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('should reject non-UUID projectId', async () => {
    const errors = await validate(toQueryDto({ projectId: 'not-a-uuid' }));
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should reject missing projectId', async () => {
    const errors = await validate(toQueryDto({}));
    expect(errors.length).toBeGreaterThan(0);
  });
});
