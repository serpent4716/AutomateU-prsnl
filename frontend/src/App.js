import './App.css';
import LoginPage from './pages/LoginPage';
import { Route, Routes, Navigate } from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import { useEffect, useState, Suspense, lazy } from 'react';
import ProtectedRoute from './ProtectedRoute';
import api from './services/api';
import { ThemeProvider } from './context/ThemeContext';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));

const StudyAssistantPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantPage'));
const StudyAssistantChatPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantChatPage'));
const StudyAssistantFlashcardPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantFlashcardPage'));
const StudyAssistantQuizPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantQuizPage'));
const StudyAssistantSummarizePage = lazy(() => import('./pages/StudyAssistant/StudyAssistantSummarizePage'));
const LostFoundPage = lazy(() => import('./pages/LostFoundPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const DocumentGeneratorPage = lazy(() => import('./pages/StudyAssistant/DocumentGeneratorPage'));

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Loading application...
  </div>
);

function App() {
  const [userInfo, setUserInfo] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error('Failed to parse user from localStorage:', err);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const refreshSession = async () => {
      try {
        const response = await api.get('/auth/refresh', { timeout: 8000 });

        if (!isMounted) return;

        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('csrf_token', response.data.csrf_token);
        setUserInfo(response.data.user);
      } catch (err) {
        if (!isMounted) return;

        localStorage.removeItem('user');
        localStorage.removeItem('csrf_token');
        setUserInfo(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    refreshSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <ThemeProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute user={userInfo}><DashboardPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute user={userInfo}><ChatPage /></ProtectedRoute>} />
            <Route path="/attendance" element={userInfo ? <AttendancePage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/login" element={<LoginPage setUserInfo={setUserInfo} />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/tasks" element={userInfo ? <TasksPage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/study-assistant" element={<StudyAssistantPage />} />
            <Route path="/lost-found" element={userInfo ? <LostFoundPage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/study-assistant/chat" element={userInfo ? <StudyAssistantChatPage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/study-assistant/docgenerator" element={userInfo ? <DocumentGeneratorPage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/study-assistant/flashcards" element={<StudyAssistantFlashcardPage />} />
            <Route path="/study-assistant/quiz" element={userInfo ? <StudyAssistantQuizPage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/study-assistant/summarize" element={userInfo ? <StudyAssistantSummarizePage user={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={userInfo ? <SettingsPage userInfo={userInfo} setUserInfo={setUserInfo} /> : <Navigate to="/login" />} />
            <Route path="/" element={userInfo ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={userInfo ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </div>
  );
}

export default App;
