
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
 
  return (
    <div className="App">
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path='/chat' element={<ChatPage />} />
        <Route path='/attendance' element={<AttendancePage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/signup' element={<SignupPage />} />
        <Route path='/tasks' element={<TasksPage />} />
        <Route path='/study-assistant' element={<StudyAssistantPage />} />
        <Route path='/lost-found' element={<LostFoundPage />} />
        <Route path='/study-assistant/chat' element={<StudyAssistantChatPage />} />
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
