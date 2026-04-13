import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Login from './Login.jsx';
import Home from './admin_pages/AdminHome.jsx';
import UserHome from './user_pages/UserHome.jsx';
import KioskAppRoot from './kiosk_pages/KioskAppRoot.jsx';

function AppRoutes() {
  // const { role } = useAuth();
  const { token } = useAuth(); // use token instead of role

  // if (!role) {
  //   return (
  //     <Routes>
  //       <Route path="/login" element={<Login />} />
  //       <Route path="*" element={<Navigate to="/login" replace />} />
  //     </Routes>
  //   );
  // }

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  // DEAL WITH ADMIN LATER
  // if (role === 'admin') {
  //   return (
  //     <Routes>
  //       <Route path="/admin/*" element={<Home />} />
  //       <Route path="*" element={<Navigate to="/admin/overview" replace />} />
  //     </Routes>
  //   );
  // }

  // if (role === 'kiosk') {
  //   return (
  //     <Routes>
  //       <Route path="/kiosk/*" element={<KioskAppRoot />} />
  //       <Route path="*" element={<Navigate to="/kiosk" replace />} />
  //     </Routes>
  //   );
  // }

  return (
    <Routes>
      <Route path="/user/*" element={<UserHome />} />
      <Route path="*" element={<Navigate to="/user/my-bookings" replace />} />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
