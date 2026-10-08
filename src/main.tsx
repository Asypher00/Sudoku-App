import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import HomePage from '../app/page';
import AuthGate from './AuthGate';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><AuthGate><HomePage /></AuthGate></StrictMode>,
);
