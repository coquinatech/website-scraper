import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { ApiTestPage } from './pages/ApiTestPage';
import Login from './pages/Login';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/api-test" element={<ApiTestPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}