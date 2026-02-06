import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@components/layout/AppLayout';
import { HostsRoute } from '@routes/HostsRoute';
import { ProjectsRoute } from '@routes/ProjectsRoute';
import { ChatRoute } from '@routes/ChatRoute';
import { NotFoundRoute } from '@routes/NotFoundRoute';

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HostsRoute />} />
        <Route path="projects" element={<ProjectsRoute />} />
        <Route path="chat" element={<ChatRoute />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  );
}
