import React from 'react';
import { createRoot } from 'react-dom/client';
import '@autharis/tokens/tokens.css';
import './styles.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('root container missing from index.html');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
