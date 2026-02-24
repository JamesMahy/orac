import { ConsoleClankerAdapter } from '../base';
import type { ConsoleConnection } from '../base';
import type {
  AdapterCapability,
  AdapterCommand,
  AdapterStreamEvent,
  SendMessageOptions,
} from '@orac/shared';

export class ClaudeCodeAdapter extends ConsoleClankerAdapter {
  readonly clankerAdapterId = 'claude-code';
  readonly name = 'Claude Code';
  readonly command = 'claude';

  readonly capabilities: AdapterCapability[] = [
    'filesystem',
    'code_execution',
    'tool_use',
    'streaming',
  ];

  readonly commands: AdapterCommand[] = [
    {
      command: 'init',
      description: 'Create a CLAUDE.md project configuration',
    },
    { command: 'review', description: 'Review uncommitted code changes' },
    { command: 'compact', description: 'Compress conversation history' },
    { command: 'clear', description: 'Clear conversation history' },
    { command: 'resume', description: 'Restore a previous conversation' },
    { command: 'plan', description: 'Enter planning mode' },
    { command: 'model', description: 'Switch between Claude models' },
    { command: 'memory', description: 'Edit project and user memory files' },
    { command: 'bug', description: 'Report an issue to Anthropic' },
    { command: 'cost', description: 'Display token usage and session costs' },
    { command: 'doctor', description: 'Run installation diagnostics' },
    { command: 'permissions', description: 'Manage tool access permissions' },
    { command: 'config', description: 'Open settings interface' },
    { command: 'mcp', description: 'Manage MCP server connections' },
    { command: 'add-dir', description: 'Add directories to context' },
    { command: 'context', description: 'Visualise context window usage' },
    {
      command: 'export',
      description: 'Save conversation to file or clipboard',
    },
    { command: 'vim', description: 'Toggle Vim-style editing' },
    { command: 'theme', description: 'Change colour theme' },
    { command: 'hooks', description: 'Configure automated action triggers' },
    { command: 'rewind', description: 'Undo messages or code changes' },
    { command: 'status', description: 'Display system information' },
    { command: 'login', description: 'Authenticate or switch accounts' },
    { command: 'logout', description: 'Sign out of current account' },
  ];

  sendMessage(
    _connection: ConsoleConnection,
    _options: SendMessageOptions,
  ): AsyncIterable<AdapterStreamEvent> {
    throw new Error('not_implemented');
  }
}
