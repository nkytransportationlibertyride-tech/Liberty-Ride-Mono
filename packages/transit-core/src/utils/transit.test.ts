/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Unit tests for Liberty Ride NKY Transit core domain logic
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGuaranteedFare,
  deriveDriverReference,
  formatUSPhone,
  validateUSPhone,
  canCancelRide,
  formatEasternTime,
  matchNKYLocation,
  calculateStatuteMiles,
  validateScheduledPickup,
  calculateTotalFaresPaid,
  formatScheduledDateTime,
} from './transit';

test('Location matching correctly finds verified NKY landmarks', () => {
  const cvg = matchNKYLocation('CVG Airport Terminal 3, Hebron KY');
  assert.ok(cvg);
  assert.equal(cvg?.zone, 'zone1');

  const hospital = matchNKYLocation('St. Elizabeth Healthcare, Edgewood');
  assert.ok(hospital);
  assert.equal(hospital?.zone, 'medical');

  const cincy = matchNKYLocation('Downtown Cincinnati, Fountain Square');
  assert.ok(cincy);
  assert.equal(cincy?.zone, 'zone2');
});

test('Distance calculation computes reasonable statute miles across NKY corridor', () => {
  // CVG (39.0461, -84.6621) to St. Elizabeth (39.0235, -84.5694)
  const dist = calculateStatuteMiles(39.0461, -84.6621, 39.0235, -84.5694);
  assert.ok(dist >= 6 && dist <= 15, `Distance was ${dist}`);
});

test('Guaranteed Fare: Zone 1 Flat for CVG Airport corridor is $35.00', () => {
  const fare = calculateGuaranteedFare(
    'CVG Airport Terminal 3, Hebron KY',
    '3038 Dixie Hwy, Erlanger, KY',
    'cvg'
  );
  assert.equal(fare.totalFare, 35.0);
  assert.equal(fare.baseFare, 35.0);
  assert.equal(fare.isFlat, true);
  assert.equal(fare.zone, 'Zone 1');
});

test('Guaranteed Fare: Zone 2 Flat for Downtown Cincinnati / Business is $45.00', () => {
  const fare = calculateGuaranteedFare(
    '3038 Dixie Hwy, Erlanger, KY',
    'Downtown Cincinnati, Fountain Square',
    'business'
  );
  assert.equal(fare.totalFare, 45.0);
  assert.equal(fare.isFlat, true);
  assert.equal(fare.zone, 'Zone 2');
});

test('Guaranteed Fare: Medical corridor starts at $20.00 base', () => {
  const fare = calculateGuaranteedFare(
    '3038 Dixie Hwy, Erlanger, KY',
    'St. Elizabeth Healthcare, Edgewood KY',
    'medical'
  );
  assert.equal(fare.baseFare, 20.0);
  assert.ok(fare.totalFare >= 20.0);
  assert.equal(fare.zone, 'Medical');
});

test('Driver UID reference derived from phone number digits only', () => {
  assert.equal(deriveDriverReference('+1 (859) 537-1827'), '8595371827');
  assert.equal(deriveDriverReference('(859) 491-8200'), '8594918200');
  assert.equal(deriveDriverReference('859-341-9088'), '8593419088');
});

test('Phone formatting and validation for US numbers', () => {
  assert.equal(formatUSPhone('8595371827'), '(859) 537-1827');
  assert.equal(formatUSPhone('18595371827'), '(859) 537-1827');
  assert.equal(validateUSPhone('(859) 537-1827'), true);
  assert.equal(validateUSPhone('859-537-1827'), true);
  assert.equal(validateUSPhone('12345'), false);
});

test('Trip Cancellation Governance enforces pre-transit boundary', () => {
  assert.equal(canCancelRide('requested'), true);
  assert.equal(canCancelRide('request_confirmed'), true);
  assert.equal(canCancelRide('driver_offer_sent'), true);
  assert.equal(canCancelRide('driver_confirmed'), true);
  assert.equal(canCancelRide('driver_en_route'), false);
  assert.equal(canCancelRide('completed'), false);
  assert.equal(canCancelRide('cancelled'), false);
});

test('Eastern Time formatting produces valid America/New_York representation', () => {
  const timeStr = formatEasternTime(new Date());
  assert.ok(timeStr.includes('EDT') || timeStr.includes('EST'));
  assert.ok(timeStr.includes(':'));
});

test('Scheduled Pickup Validation rejects past dates and accepts future dates', () => {
  const refDate = new Date('2026-10-27T14:00:00Z'); // 10:00 AM EDT
  // Past date
  const pastRes = validateScheduledPickup('2026-10-20', '08:00 AM', refDate);
  assert.equal(pastRes.valid, false);
  assert.equal(pastRes.error, 'Pickup date cannot be in the past');

  // Future date
  const futureRes = validateScheduledPickup('2026-10-30', '10:00 AM', refDate);
  assert.equal(futureRes.valid, true);

  // Missing fields
  assert.equal(validateScheduledPickup('', '10:00 AM', refDate).valid, false);
  assert.equal(validateScheduledPickup('2026-10-30', '', refDate).valid, false);
});

test('calculateTotalFaresPaid sums only completed rides', () => {
  const sampleRides: { fareEstimate: number; status: any }[] = [
    { fareEstimate: 35.0, status: 'completed' },
    { fareEstimate: 20.0, status: 'completed' },
    { fareEstimate: 45.0, status: 'cancelled' },
    { fareEstimate: 35.0, status: 'driver_en_route' },
  ];
  const total = calculateTotalFaresPaid(sampleRides);
  assert.equal(total, 55.0);
});

test('formatScheduledDateTime creates formatted date-time string', () => {
  const formatted = formatScheduledDateTime('2026-10-28', '04:30 PM');
  assert.equal(formatted, 'Oct 28, 2026 • 04:30 PM EDT');
});

