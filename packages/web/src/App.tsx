import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@components/layout/AppLayout';
import { Login } from '@features/Login';
import { HostsRoute } from '@routes/HostsRoute';
import { ProjectsRoute } from '@routes/ProjectsRoute';
import { ChatRoute } from '@routes/ChatRoute';
import { NotFoundRoute } from '@routes/NotFoundRoute';
import { useAuthStore } from '@stores/authStore';

export function App() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Login />;
  }

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
