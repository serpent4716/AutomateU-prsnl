
import './App.css';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import AttendancePage from './pages/AttendancePage';
import LoginPage from './pages/LoginPage';
import { Route, Routes, Navigate} from 'react-router-dom';
import SignupPage from './pages/SignupPage';
import StudyAssistantPage from './pages/StudyAssistant/StudyAssistantPage';
import StudyAssistantWritePage from './pages/StudyAssistant/StudyAssistantWritePage';
import StudyAssistantChatPage from './pages/StudyAssistant/StudyAssistantChatPage';
import StudyAssistantFlashcardPage from './pages/StudyAssistant/StudyAssistantFlashcardPage';
import StudyAssistantQuizPage from './pages/StudyAssistant/StudyAssistantQuizPage';
import StudyAssistantSummarizePage from './pages/StudyAssistant/StudyAssistantSummarizePage';
import LostFoundPage from './pages/LostFoundPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import api from './services/api';
import { useEffect, useState } from 'react';

const LoadingSpinner = () => <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading application...</div>;

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
              // If the API call fails, the user is not logged in. Clean up.
              localStorage.removeItem("user");
              localStorage.removeItem("csrf_token");
              setUserInfo(null);
              <Navigate to="/login" replace />;
          } finally {
              setIsLoading(false);
              console.log("--- Session check finished ---");
          }
      };

      refreshSession();
  }, []);
  if (isLoading) {
        return <LoadingSpinner />;
    }
  return (
    <div className="App">
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/attendance' element={<AttendancePage />} />
        <Route path='/login' element={<LoginPage setUserInfo={setUserInfo}/>} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/tasks' element={userInfo ? <TasksPage user={userInfo} /> : <Navigate to='/login' />} />
        <Route path='/study-assistant' element={<StudyAssistantPage />} />
        <Route path='/lost-found' element={<LostFoundPage />} />
        <Route path='/study-assistant/chat' element={userInfo ? <StudyAssistantChatPage user={userInfo}/> : <Navigate to='/login' />} />
        <Route path='/study-assistant/write' element={<StudyAssistantWritePage />} />
        <Route path='/study-assistant/flashcards' element={<StudyAssistantFlashcardPage />} />
        <Route path='/study-assistant/quiz' element={<StudyAssistantQuizPage />} />
        <Route path='/study-assistant/summarize' element={<StudyAssistantSummarizePage />} />
        <Route path='/settings' element={<SettingsPage />} />
        <Route path='*' element={ <DashboardPage /> } />
      </Routes>
      
    </div>
  );
}

export default App;
