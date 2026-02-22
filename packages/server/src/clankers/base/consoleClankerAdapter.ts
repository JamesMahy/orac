import { BaseClankerAdapter } from './baseClankerAdapter';
import type {
  AdapterField,
  AdapterSessionStrategy,
  AdapterStreamEvent,
  HandleCommandOptions,
  SendMessageOptions,
} from '@orac/shared';

export type ConsoleConnection = {
  hostId: string;
  workspacePath: string;
};

export abstract class ConsoleClankerAdapter extends BaseClankerAdapter {
  readonly type = 'console' as const;
  readonly fields: AdapterField[] = [];
  readonly sessionStrategy: AdapterSessionStrategy = 'managed';

  abstract override readonly command: string;

  abstract sendMessage(
    connection: ConsoleConnection,
    options: SendMessageOptions,
  ): AsyncIterable<AdapterStreamEvent>;

  handleCommand(
    _connection: ConsoleConnection,
    _options: HandleCommandOptions,
  ): AsyncIterable<AdapterStreamEvent> {
    throw new Error('command_not_supported');
  }
}
