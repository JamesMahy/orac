import { BaseClankerAdapter } from './baseClankerAdapter';
import type {
  AdapterSessionStrategy,
  AdapterStreamEvent,
  HandleCommandOptions,
  SendMessageOptions,
} from '@orac/shared';

export type ApiConnection = {
  endpoint: string;
  apiKey: string;
  model: string;
};

export abstract class ApiClankerAdapter extends BaseClankerAdapter {
  readonly type = 'api' as const;
  readonly sessionStrategy: AdapterSessionStrategy = 'unmanaged';
  abstract override readonly defaultEndpoint: string | null;

  abstract sendMessage(
    connection: ApiConnection,
    options: SendMessageOptions,
  ): AsyncIterable<AdapterStreamEvent>;

  handleCommand(
    _connection: ApiConnection,
    _options: HandleCommandOptions,
  ): AsyncIterable<AdapterStreamEvent> {
    throw new Error('command_not_supported');
  }
}
