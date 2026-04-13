import { Routes, Route, Navigate } from 'react-router-dom';
import KioskHome from './KioskHome.jsx';

export default function KioskAppRoot() {
  return (
    <Routes>
      <Route index element={<KioskHome />} />
      <Route path="*" element={<Navigate to="/kiosk" replace />} />
    </Routes>
  );
}
