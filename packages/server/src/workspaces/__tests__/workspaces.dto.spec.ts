import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  ListWorkspacesQueryDto,
  AddWorkspaceClankerDto,
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

function toAddClankerDto(
  data: Record<string, unknown>,
): AddWorkspaceClankerDto {
  return plainToInstance(AddWorkspaceClankerDto, data);
}

function omit<T extends Record<string, unknown>>(
  obj: T,
  ...keys: string[]
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key)),
  );
}

async function expectCreateValid(data: Record<string, unknown>) {
  const errors = await validate(toCreateDto(data));
  expect(errors).toHaveLength(0);
}

async function expectCreateInvalid(
  data: Record<string, unknown>,
  property?: string,
) {
  const errors = await validate(toCreateDto(data));
  expect(errors.length).toBeGreaterThan(0);
  if (property) {
    expect(errors.some(error => error.property === property)).toBe(true);
  }
}

const validWorkspace = {
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  primaryClankerId: '880e8400-e29b-41d4-a716-446655440000',
  name: 'exercise-service',
  path: '/home/james/bearly-fit/exercise-service',
};

describe('CreateWorkspaceDto', () => {
  describe('valid inputs', () => {
    it('should accept a valid workspace', async () => {
      await expectCreateValid(validWorkspace);
    });

    it('should accept a workspace without path', async () => {
      await expectCreateValid(omit(validWorkspace, 'path'));
    });

    it('should accept a workspace without hostId', async () => {
      await expectCreateValid(omit(validWorkspace, 'hostId'));
    });

    it('should accept a workspace with optional hostId', async () => {
      await expectCreateValid({
        ...validWorkspace,
        hostId: '660e8400-e29b-41d4-a716-446655440000',
      });
    });

    it('should accept a workspace with clankerIds array', async () => {
      await expectCreateValid({
        ...validWorkspace,
        clankerIds: ['770e8400-e29b-41d4-a716-446655440000'],
      });
    });
  });

  describe('projectId validation', () => {
    it('should reject missing projectId', async () => {
      await expectCreateInvalid(omit(validWorkspace, 'projectId'), 'projectId');
    });

    it('should reject non-UUID projectId', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, projectId: 'not-a-uuid' },
        'projectId',
      );
    });
  });

  describe('primaryClankerId validation', () => {
    it('should reject missing primaryClankerId', async () => {
      await expectCreateInvalid(
        omit(validWorkspace, 'primaryClankerId'),
        'primaryClankerId',
      );
    });

    it('should reject non-UUID primaryClankerId', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, primaryClankerId: 'not-a-uuid' },
        'primaryClankerId',
      );
    });
  });

  describe('hostId validation', () => {
    it('should reject non-UUID hostId', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, hostId: 'not-a-uuid' },
        'hostId',
      );
    });
  });

  describe('name validation', () => {
    it('should reject empty name', async () => {
      await expectCreateInvalid({ ...validWorkspace, name: '' }, 'name');
    });

    it('should reject name exceeding 255 characters', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, name: 'a'.repeat(256) },
        'name',
      );
    });

    it('should reject missing name', async () => {
      await expectCreateInvalid(omit(validWorkspace, 'name'), 'name');
    });
  });

  describe('path validation', () => {
    it('should accept path as optional', async () => {
      await expectCreateValid(omit(validWorkspace, 'path'));
    });

    it('should reject path exceeding 4096 characters', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, path: 'a'.repeat(4097) },
        'path',
      );
    });
  });

  describe('clankers validation', () => {
    it('should accept clankers as optional', async () => {
      await expectCreateValid(omit(validWorkspace, 'clankers'));
    });

    it('should accept an array of valid clanker entries', async () => {
      await expectCreateValid({
        ...validWorkspace,
        clankers: [{ clankerId: '770e8400-e29b-41d4-a716-446655440001' }],
      });
    });

    it('should accept clanker entries with overrides', async () => {
      await expectCreateValid({
        ...validWorkspace,
        clankers: [
          {
            clankerId: '770e8400-e29b-41d4-a716-446655440001',
            modelOverride: 'claude-opus-4-6',
            temperatureOverride: 0.7,
          },
        ],
      });
    });

    it('should reject a clanker entry with a non-UUID clankerId', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, clankers: [{ clankerId: 'not-a-uuid' }] },
        'clankers',
      );
    });

    it('should reject a non-array clankers value', async () => {
      await expectCreateInvalid(
        { ...validWorkspace, clankers: 'not-an-array' },
        'clankers',
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

  it('should reject empty name', async () => {
    const errors = await validate(toUpdateDto({ name: '' }));
    expect(errors.some(error => error.property === 'name')).toBe(true);
  });

  it('should reject name exceeding 255 characters', async () => {
    const errors = await validate(toUpdateDto({ name: 'a'.repeat(256) }));
    expect(errors.some(error => error.property === 'name')).toBe(true);
  });

  it('should not validate projectId in update', async () => {
    const errors = await validate(
      toUpdateDto({ projectId: 'not-a-uuid', name: 'new-name' }),
    );
    expect(errors.every(error => error.property !== 'projectId')).toBe(true);
  });

  it('should validate hostId format in update', async () => {
    const errors = await validate(
      toUpdateDto({ hostId: 'not-a-uuid', name: 'new-name' }),
    );
    expect(errors.some(error => error.property === 'hostId')).toBe(true);
  });

  it('should accept null hostId to clear the host', async () => {
    const errors = await validate(toUpdateDto({ hostId: null }));
    expect(errors).toHaveLength(0);
  });

  it('should validate primaryClankerId format in update', async () => {
    const errors = await validate(
      toUpdateDto({ primaryClankerId: 'not-a-uuid' }),
    );
    expect(errors.some(error => error.property === 'primaryClankerId')).toBe(
      true,
    );
  });

  it('should accept a valid UUID primaryClankerId in update', async () => {
    const errors = await validate(
      toUpdateDto({ primaryClankerId: '550e8400-e29b-41d4-a716-446655440002' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('should accept a valid UUID currentClankerId in update', async () => {
    const errors = await validate(
      toUpdateDto({ currentClankerId: '550e8400-e29b-41d4-a716-446655440002' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('should accept null currentClankerId to reset to primary', async () => {
    const errors = await validate(toUpdateDto({ currentClankerId: null }));
    expect(errors).toHaveLength(0);
  });

  it('should validate currentClankerId format in update', async () => {
    const errors = await validate(
      toUpdateDto({ currentClankerId: 'not-a-uuid' }),
    );
    expect(errors.some(error => error.property === 'currentClankerId')).toBe(
      true,
    );
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

describe('AddWorkspaceClankerDto', () => {
  it('should accept a valid UUID clankerId', async () => {
    const errors = await validate(
      toAddClankerDto({ clankerId: '550e8400-e29b-41d4-a716-446655440002' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('should reject a non-UUID clankerId', async () => {
    const errors = await validate(toAddClankerDto({ clankerId: 'not-a-uuid' }));
    expect(errors.some(error => error.property === 'clankerId')).toBe(true);
  });

  it('should reject a missing clankerId', async () => {
    const errors = await validate(toAddClankerDto({}));
    expect(errors.some(error => error.property === 'clankerId')).toBe(true);
  });
});
