import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './__shared__/ProtectedRoute';
import RoleSelect from './pages/RoleSelect';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import BookService from './pages/BookService';
import ServiceList from './pages/ServiceList';
import ProviderDetail from './pages/ProviderDetail';
import Profile from './pages/Profile';
import Complaints from './pages/Complaints';
import TrackBooking from './pages/customer/TrackBooking';
import ProviderHome from './pages/provider/ProviderHome';
import ProviderBookings from './pages/provider/ProviderBookings';
import ManageJob from './pages/provider/ManageJob';
import ProviderProfile from './pages/provider/ProviderProfile';
import PostJob from './pages/PostJob';
import MyRequests from './pages/MyRequests';
import JobOffers from './pages/JobOffers';
import ProviderSetup from './pages/provider/ProviderSetup';
import PageNotFound from './lib/PageNotFound';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Default route - redirect to role-select */}
        <Route path="/" element={<Navigate to="/role-select" replace />} />
        
        {/* Public Routes */}
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Customer Routes - With Bottom Navigation */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <Bookings />
            </ProtectedRoute>
          } />
          <Route path="/book/:providerId" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <BookService />
            </ProtectedRoute>
          } />
          <Route path="/services/:category" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ServiceList />
            </ProtectedRoute>
          } />
          <Route path="/provider/:id" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ProviderDetail />
            </ProtectedRoute>
          } />
          <Route path="/track/:id" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <TrackBooking />
            </ProtectedRoute>
          } />
          <Route path="/complaints" element={
            <ProtectedRoute allowedRoles={['customer', 'provider']}>
              <Complaints />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['customer', 'provider']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/post-job" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <PostJob />
            </ProtectedRoute>
          } />
          <Route path="/my-requests" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MyRequests />
            </ProtectedRoute>
          } />
          <Route path="/job/:id/offers" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <JobOffers />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Provider Routes - No Bottom Navigation */}
        <Route path="/provider/home" element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderHome />
          </ProtectedRoute>
        } />
        <Route path="/provider/bookings" element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderBookings />
          </ProtectedRoute>
        } />
        <Route path="/provider/job/:id" element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ManageJob />
          </ProtectedRoute>
        } />
        <Route path="/provider/profile" element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderProfile />
          </ProtectedRoute>
        } />
        <Route path="/provider/setup" element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderSetup />
          </ProtectedRoute>
        } />
        
        {/* 404 Page */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;