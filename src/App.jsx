// Main App component that defines the routing structure
// This component sets up all the routes for the chat application,
// including authentication routes and protected chat routes

import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import ChatLayout from './layouts/ChatLayout';
import ChatConversationPage from './pages/ChatConversationPage';
import ChatListPage from './pages/ChatListPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      <Routes>
        {/* Authentication routes wrapped in AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected chat routes that require authentication */}
        <Route
          element={
            <ProtectedRoute>
              <ChatLayout />
            </ProtectedRoute>
          }
          path="/chats"
        >
          <Route index element={<ChatListPage />} />
          <Route path=":chatId" element={<ChatConversationPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <Navigate replace to="/chats" />
            </ProtectedRoute>
          }
          path="/chat"
        />
        <Route
          element={
            <ProtectedRoute>
              <Navigate replace to="/chats" />
            </ProtectedRoute>
          }
          path="/chat/:chatId"
        />

        {/* Catch-all route redirects to login */}
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
