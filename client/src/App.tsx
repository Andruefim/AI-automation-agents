import React from 'react';
import { AuthProvider } from './shared/context/AuthContext';
import { AppRouter } from './core/router/AppRouter';
import './shared/styles/globals.css';

const App: React.FC = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;
