import React from 'react';
import { TransitProvider, RiderApp } from '@liberty/transit-core';

export default function App() {
  return (
    <TransitProvider initialRole="rider">
      <RiderApp />
    </TransitProvider>
  );
}