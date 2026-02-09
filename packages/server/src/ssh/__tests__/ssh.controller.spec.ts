import { Test, TestingModule } from '@nestjs/testing';
import { SshController } from '../ssh.controller';
import { SshService } from '../ssh.service';
import { TestConnectionDto } from '../ssh.dto';

describe('SshController', () => {
  let controller: SshController;
  let mockSshService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockSshService = {
      testConnection: jest.fn(),
      getStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SshController],
      providers: [{ provide: SshService, useValue: mockSshService }],
    }).compile();

    controller = module.get(SshController);
  });

  describe('POST /hosts/test-connection', () => {
    it('should delegate to sshService.testConnection', async () => {
      const dto: TestConnectionDto = {
        hostname: '192.168.1.100',
        username: 'root',
        password: 'secret',
      };
      const expected = {
        success: true,
        message: 'Connection successful',
        fingerprint: 'SHA256:abc123',
      };
      mockSshService.testConnection.mockResolvedValue(expected);

      const result = await controller.testConnection(dto);

      expect(mockSshService.testConnection).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });

    it('should return failure result on connection error', async () => {
      const dto: TestConnectionDto = {
        hostname: '192.168.1.100',
        username: 'root',
      };
      const expected = {
        success: false,
        message: 'Connection refused',
      };
      mockSshService.testConnection.mockResolvedValue(expected);

      const result = await controller.testConnection(dto);

      expect(result).toEqual(expected);
    });
  });

  describe('GET /hosts/:id/status', () => {
    it('should return status with hostId', () => {
      const hostId = '550e8400-e29b-41d4-a716-446655440000';
      mockSshService.getStatus.mockReturnValue({
        status: 'disconnected',
      });

      const result = controller.getStatus(hostId);

      expect(mockSshService.getStatus).toHaveBeenCalledWith(hostId);
      expect(result).toEqual({
        hostId,
        status: 'disconnected',
      });
    });

    it('should include message when present', () => {
      const hostId = '550e8400-e29b-41d4-a716-446655440000';
      mockSshService.getStatus.mockReturnValue({
        status: 'error',
        message: 'Connection refused',
      });

      const result = controller.getStatus(hostId);

      expect(result).toEqual({
        hostId,
        status: 'error',
        message: 'Connection refused',
      });
    });
  });
});
