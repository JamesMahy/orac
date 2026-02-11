import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProjectDto } from '../projects.dto';

function toDto(data: Record<string, unknown>): CreateProjectDto {
  return plainToInstance(CreateProjectDto, data);
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

const validProject = { name: 'Bearly Fit' };

describe('CreateProjectDto', () => {
  describe('valid inputs', () => {
    it('should accept a valid project', async () => {
      await expectValid(validProject);
    });

    it('should accept a name at max length', async () => {
      await expectValid({ name: 'a'.repeat(255) });
    });

    it('should accept a project with description', async () => {
      await expectValid({
        name: 'Bearly Fit',
        description: 'Fitness tracking application',
      });
    });

    it('should accept a project without description', async () => {
      await expectValid({ name: 'Bearly Fit' });
    });
  });

  describe('name validation', () => {
    it('should reject empty name', async () => {
      await expectInvalid({ name: '' }, 'name');
    });

    it('should reject name exceeding 255 characters', async () => {
      await expectInvalid({ name: 'a'.repeat(256) }, 'name');
    });

    it('should reject missing name', async () => {
      await expectInvalid({}, 'name');
    });

    it('should reject non-string name', async () => {
      await expectInvalid({ name: 123 }, 'name');
    });
  });

  describe('description validation', () => {
    it('should accept description at max length', async () => {
      await expectValid({
        name: 'Bearly Fit',
        description: 'a'.repeat(2000),
      });
    });

    it('should reject description exceeding 2000 characters', async () => {
      await expectInvalid(
        { name: 'Bearly Fit', description: 'a'.repeat(2001) },
        'description',
      );
    });

    it('should reject non-string description', async () => {
      await expectInvalid(
        { name: 'Bearly Fit', description: 123 },
        'description',
      );
    });
  });
});
