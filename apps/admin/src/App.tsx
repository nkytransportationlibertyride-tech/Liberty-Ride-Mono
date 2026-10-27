import React from 'react';
import { TransitProvider, OwnerConsole } from '@liberty/transit-core';

export default function App() {
  return (
    <TransitProvider initialRole="owner">
      <OwnerConsole />
    </TransitProvider>
  );
}