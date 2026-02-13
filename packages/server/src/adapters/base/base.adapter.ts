import type {
  AdapterType,
  AdapterCapability,
  AdapterCommand,
  AdapterField,
  AdapterDefinition,
  AdapterSessionStrategy,
  AdapterStreamEvent,
  SendMessageOptions,
  HandleCommandOptions,
} from '@orac/shared';

export abstract class BaseAdapter {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly type: AdapterType;
  abstract readonly capabilities: AdapterCapability[];
  abstract readonly commands: AdapterCommand[];
  abstract readonly fields: AdapterField[];
  abstract readonly sessionStrategy: AdapterSessionStrategy;

  readonly command: string | null = null;
  readonly defaultEndpoint: string | null = null;

  toDefinition(): AdapterDefinition {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      command: this.command,
      capabilities: this.capabilities,
      commands: this.commands,
      fields: this.fields,
      defaultEndpoint: this.defaultEndpoint,
      sessionStrategy: this.sessionStrategy,
    };
  }

  abstract sendMessage(
    connection: unknown,
    options: SendMessageOptions,
  ): AsyncIterable<AdapterStreamEvent>;

  handleCommand(
    _connection: unknown,
    _options: HandleCommandOptions,
  ): AsyncIterable<AdapterStreamEvent> {
    throw new Error('command_not_supported');
  }

  listModels(_connection: unknown): Promise<string[]> {
    return Promise.resolve([]);
  }
}
