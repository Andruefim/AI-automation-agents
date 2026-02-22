import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing }        from '../../features/landing/Landing';
import { Login, Register } from '../../features/auth/Auth';
import { Dashboard }       from '../../features/dashboard/Dashboard';
import { Wizard }          from '../../features/wizard/Wizard';
import { Group }           from '../../features/group/Group';

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"                      element={<Landing />} />
      <Route path="/login"                 element={<Login />} />
      <Route path="/register"              element={<Register />} />
      <Route path="/dashboard"             element={<Dashboard />} />
      <Route path="/dashboard/connect"     element={<Wizard />} />
      <Route path="/dashboard/groups/:id"  element={<Group />} />
      <Route path="*"                      element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
