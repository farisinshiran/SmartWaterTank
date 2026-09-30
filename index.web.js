import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Mengarah ke App.tsx Anda
import { name as appName } from './app.json';
import { AppRegistry } from 'react-native';

// 1. Daftarkan aplikasi ke registry bawaan React Native
AppRegistry.registerComponent(appName, () => App);

// 2. Dapatkan komponen aplikasi yang sudah siap untuk Web
const { element } = AppRegistry.getApplication(appName);

// 3. Render menggunakan metode createRoot standar React 19
const rootElement = document.getElementById('app-root');
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    {element}
  </React.StrictMode>
);
