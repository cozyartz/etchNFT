import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(13, 13, 13, 0.95)',
          color: '#ffffff',
          border: '1px solid #FF1493',
          borderRadius: '12px',
          boxShadow: '0 0 20px rgba(255, 20, 147, 0.3), 0 0 40px rgba(255, 20, 147, 0.1)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'Chakra Petch, monospace',
          fontWeight: '500',
        },
        success: {
          iconTheme: {
            primary: '#39FF14',
            secondary: '#0D0D0D',
          },
          style: {
            border: '1px solid #39FF14',
            boxShadow: '0 0 20px rgba(57, 255, 20, 0.3), 0 0 40px rgba(57, 255, 20, 0.1)',
          },
        },
        error: {
          iconTheme: {
            primary: '#FF1493',
            secondary: '#0D0D0D',
          },
          style: {
            border: '1px solid #FF1493',
            boxShadow: '0 0 20px rgba(255, 20, 147, 0.3), 0 0 40px rgba(255, 20, 147, 0.1)',
          },
        },
        loading: {
          iconTheme: {
            primary: '#00FFFF',
            secondary: '#0D0D0D',
          },
          style: {
            border: '1px solid #00FFFF',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.1)',
          },
        },
      }}
    />
  );
};

export default ToastProvider;