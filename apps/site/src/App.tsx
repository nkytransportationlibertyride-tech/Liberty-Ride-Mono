import React from 'react';
import { TransitProvider, LandingPage } from '@liberty/transit-core';

export default function App() {
  return (
    <TransitProvider initialRole="public">
      <LandingPage />
    </TransitProvider>
  );
}