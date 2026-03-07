import { useParams, useOutletContext } from 'react-router-dom';
import { Header } from '@components/layout/Header';
import type { LayoutContext } from '@components/layout/AppLayout';
import { useWorkspace } from '@hooks/useWorkspaces';
import { WorkspaceChat } from '@features/WorkspaceChat';

export function WorkspaceChatRoute() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { onMenuToggle, sidebarOpen } = useOutletContext<LayoutContext>();
  const { data: workspace } = useWorkspace(workspaceId!);

  return (
    <>
      <Header
        onMenuToggle={onMenuToggle}
        title={workspace?.name ?? '...'}
        isSidebarOpen={sidebarOpen}
      />
      <WorkspaceChat workspaceId={workspaceId!} />
    </>
  );
}
