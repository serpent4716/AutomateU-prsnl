import './App.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import api from './services/api';
import ProtectedRoute from './ProtectedRoute';

import ThemeProvider from "./context/ThemeContext";

// wrapper (IMPORTANT)
import DashboardWrapper from './wrapper/DashboardWrapper';
import ChatWrapper from './wrapper/ChatWrapper';
import AttendanceWrapper from './wrapper/AttendanceWrapper';
import LoginWrapper from './wrapper/LoginWrapper';
import SignupWrapper from './wrapper/SignupWrapper';
import TasksWrapper from './wrapper/TasksWrapper';
import LostFoundWrapper from './wrapper/LostFoundWrapper';

// Study Assistant pages (these remain the same)
const StudyAssistantPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantPage'));
const StudyAssistantChatPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantChatPage'));
const StudyAssistantFlashcardPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantFlashcardPage'));
const StudyAssistantQuizPage = lazy(() => import('./pages/StudyAssistant/StudyAssistantQuizPage'));
const StudyAssistantSummarizePage = lazy(() => import('./pages/StudyAssistant/StudyAssistantSummarizePage'));
const DocumentGeneratorPage = lazy(() => import('./pages/StudyAssistant/DocumentGeneratorPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    Loading application...
  </div>
);

function App() {
  const [userInfo, setUserInfo] = useState(() => {
    const storedUser = localStorage.getItem("user");
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Refresh session on mount
  useEffect(() => {
    const refreshSession = async () => {
      console.log("--- Starting session check ---");

      try {
        console.log("Attempting to call /auth/refresh to verify session...");
        const response = await api.get("/auth/refresh");

        console.log("API call successful. User is authenticated.");
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("csrf_token", response.data.csrf_token);
        setUserInfo(response.data.user);

      } catch (err) {
        console.log("API call failed. User is not authenticated.");
        localStorage.removeItem("user");
        localStorage.removeItem("csrf_token");
        setUserInfo(null);
      } finally {
        setIsLoading(false);
        console.log("--- Session check finished ---");
      }
    };

    refreshSession();
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <ThemeProvider>
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>

            {/* Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            } />

            {/* Chat */}
            <Route path="/chat" element={<ChatWrapper />} />

            {/* Attendance */}
            <Route path="/attendance" element={
              userInfo ? <AttendanceWrapper user={userInfo} /> : <Navigate to="/login" />
            } />

            {/* Login / Signup */}
            <Route path="/login" element={<LoginWrapper setUserInfo={setUserInfo} />} />
            <Route path="/signup" element={<SignupWrapper />} />

            {/* Tasks */}
            <Route path="/tasks" element={
              userInfo ? <TasksWrapper user={userInfo} /> : <Navigate to="/login" />
            } />

            {/* Lost & Found */}
            <Route path="/lost-found" element={
              userInfo ? <LostFoundWrapper user={userInfo} /> : <Navigate to="/login" />
            } />

            {/* Study Assistant Pages (unchanged) */}
            <Route path="/study-assistant" element={<StudyAssistantPage />} />
            <Route path="/study-assistant/chat" element={
              userInfo ? <StudyAssistantChatPage user={userInfo} /> : <Navigate to="/login" />
            } />

            <Route path="/study-assistant/docgenerator" element={
              userInfo ? <DocumentGeneratorPage user={userInfo} /> : <Navigate to="/login" />
            } />

            <Route path="/study-assistant/flashcards" element={<StudyAssistantFlashcardPage />} />
            <Route path="/study-assistant/quiz" element={
              userInfo ? <StudyAssistantQuizPage user={userInfo} /> : <Navigate to="/login" />
            } />

            <Route path="/study-assistant/summarize" element={
              userInfo ? <StudyAssistantSummarizePage user={userInfo} /> : <Navigate to="/login" />
            } />

            {/* Settings (unchanged) */}
            <Route path="/settings" element={
              userInfo ? <SettingsPage userInfo={userInfo} setUserInfo={setUserInfo} /> : <Navigate to="/login" />
            } />

            {/* Default fallback */}
            <Route path="*" element={<DashboardWrapper />} />

          </Routes>
        </Suspense>
      </div>
    </ThemeProvider>
  );
}

export default App;
