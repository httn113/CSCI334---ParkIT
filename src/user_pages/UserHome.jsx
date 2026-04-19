import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../DashboardLayout.jsx';

const MyBookings = lazy(() => import('./MyBookings.jsx'));
const FindParking = lazy(() => import('./FindParking.jsx'));
const MyProfile = lazy(() => import('./MyProfile.jsx'));
const Subscribtion = lazy(() => import('./subscribtion.jsx'));
const Support = lazy(() => import('./Support.jsx'));

const userNavItems = [
  {
    label: 'My Bookings',
    path: '/user/my-bookings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <polyline points="9 15 11 17 15 13" />
      </svg>
    ),
  },
  {
    label: 'Find Parking',
    path: '/user/find-parking',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    label: 'My Profile',
    path: '/user/my-profile',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Subscribtion',
    path: '/user/subscribtion',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Support',
    path: '/user/support',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

export default function UserHome() {
  return (
    <DashboardLayout
      navItems={userNavItems}
      title="ParkIT"
      subtitle="User Portal"
      avatarLetter="U"
      badgeText="Online"
    >
      <Routes>
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="find-parking" element={<FindParking />} />
        <Route path="my-profile" element={<MyProfile />} />
        <Route path="subscribtion" element={<Subscribtion />} />
        <Route path="support" element={<Support />} />
        <Route path="*" element={<Navigate to="my-bookings" replace />} />
      </Routes>
    </DashboardLayout>
  );
}