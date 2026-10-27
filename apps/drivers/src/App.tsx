import React from 'react';
import { TransitProvider, DriverApp } from '@liberty/transit-core';

export default function App() {
  return (
    <TransitProvider initialRole="driver">
      <DriverApp />
    </TransitProvider>
  );
}