import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { AdapterCommand } from '@orac/shared';
import { useMessages, useMessageCache } from '@hooks/useMessages';
import { useWorkspace } from '@hooks/useWorkspaces';
import { useAdapters } from '@hooks/useAdapters';
import { messagesApi } from '@api/messages';
import { MessageList } from '@components/MessageList';
import { MessageInput } from '@components/MessageInput';

type WorkspaceChatProps = {
  workspaceId: string;
};

export function WorkspaceChat({ workspaceId }: WorkspaceChatProps) {
  const { t } = useTranslation('features', { keyPrefix: 'WorkspaceChat' });

  const [isSending, setIsSending] = useState(false);
  const [selectedClankerId, setSelectedClankerId] = useState<string | null>(
    null,
  );
  const [temperatureOverride, setTemperatureOverride] = useState('');

  const { data: workspace, isLoading: isLoadingWorkspace } =
    useWorkspace(workspaceId);

  const { data: adapters } = useAdapters();

  const {
    messages,
    isLoading: isLoadingMessages,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(workspaceId);

  const { addMessage } = useMessageCache(workspaceId);

  const clankerOptions = useMemo(() => {
    if (!workspace) return [];

    const options = [...workspace.clankers].map(clanker => ({
      clankerId: clanker.clankerId,
      name: clanker.name,
      clankerAdapterId: clanker.clankerAdapterId,
    }));

    if (
      workspace.primaryClanker &&
      !options.some(
        option => option.clankerId === workspace.primaryClanker!.clankerId,
      )
    ) {
      options.unshift(workspace.primaryClanker);
    }
    return options;
  }, [workspace]);

  const selectedCommands: AdapterCommand[] = useMemo(() => {
    if (!selectedClankerId || !adapters) return [];

    const selectedClanker = clankerOptions.find(
      clanker => clanker.clankerId === selectedClankerId,
    );
    if (!selectedClanker) return [];

    const adapter = adapters.find(
      adapterDef =>
        adapterDef.clankerAdapterId === selectedClanker.clankerAdapterId,
    );
    return adapter?.commands ?? [];
  }, [selectedClankerId, adapters, clankerOptions]);

  const handleLoadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const handleSend = useCallback(
    async (content: string, attachmentIds: string[]) => {
      if (!workspace) return;

      setIsSending(true);
      try {
        const message = await messagesApi.createMessage(workspaceId, {
          content,
          targetClankerId: selectedClankerId ?? undefined,
          attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
        });

        addMessage(message);
      } finally {
        setIsSending(false);
      }
    },
    [workspace, workspaceId, selectedClankerId, addMessage],
  );

  // Sync selected clanker from last message's target, or fall back to primary
  useEffect(() => {
    if (!workspace) return;

    const lastMessage = messages[messages.length - 1];
    const targetId = lastMessage?.targetClankerId ?? workspace.primaryClankerId;

    if (targetId) setSelectedClankerId(targetId);
    else if (clankerOptions.length > 0) {
      setSelectedClankerId(clankerOptions[0].clankerId);
    }
  }, [workspace, clankerOptions, messages]);

  // Sync temperature override when selected clanker changes
  useEffect(() => {
    if (!workspace || !selectedClankerId) return;
    const selectedClanker = workspace.clankers.find(
      clanker => clanker.clankerId === selectedClankerId,
    );

    setTemperatureOverride(
      selectedClanker?.temperatureOverride != null
        ? String(selectedClanker.temperatureOverride)
        : '',
    );
  }, [workspace, selectedClankerId]);

  if (isLoadingWorkspace) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <i
          className="pi pi-spin pi-spinner text-2xl text-text-muted"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-text-muted">{t('Workspace not found')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        hasMore={hasNextPage}
        isFetchingMore={isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />
      <MessageInput
        workspaceId={workspaceId}
        clankerOptions={clankerOptions}
        selectedClankerId={selectedClankerId}
        temperatureOverride={temperatureOverride}
        commands={selectedCommands}
        isSending={isSending}
        onClankerChange={setSelectedClankerId}
        onTemperatureChange={setTemperatureOverride}
        onSend={handleSend}
      />
    </div>
  );
}
