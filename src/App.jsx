import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { AuthGuard } from './components/layout/AuthGuard';

// Pages
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import ProgressDetail from './pages/ProgressDetail';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Diary from './pages/Diary';
import Messages from './pages/Messages';
import Team from './pages/Team';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route path="/" element={<AuthGuard />}>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="progress" element={<Progress />} />
                <Route path="progress/:id" element={<ProgressDetail />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="reports" element={<Reports />} />
                <Route path="diary" element={<Diary />} />
                <Route path="messages" element={<Messages />} />
                <Route path="team" element={<Team />} />
                <Route path="logs" element={<Logs />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
