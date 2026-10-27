/**
 * Firestore Seed Script — Demo Data for SmartWaterTank
 *
 * Populates Firestore with realistic demo data so the app can be demonstrated
 * without an actual ESP32 connected.
 *
 * Usage:
 *   node --experimental-vm-modules scripts/seed-firestore.js
 *
 * Prerequisites:
 *   1. Download service account key from Firebase Console
 *      (Project Settings → Service Accounts → Generate new private key)
 *   2. Save it as scripts/service-account.json
 *   3. Set GOOGLE_APPLICATION_CREDENTIALS=scripts/service-account.json
 *      (or update FIREBASE_CREDENTIALS_PATH below)
 *
 * Collections populated:
 *   - telemetry_logs          — 30 entries of sensor history (4 hours)
 *   - alarm_settings/{tankId} — alarm enabled flag
 *   - tank_members/{tankId}/members/{uid} — demo user membership
 *   - user_notifications/{uid}/items/{id} — 3 sample notifications
 */

'use strict';

const admin = require('firebase-admin');

// ── CONFIGURATION ──────────────────────────────────────────────────────────────
const TANK_ID = 'toren-gedung-a-01';
const DEMO_UID = 'demo-user-uid-001'; // placeholder UID for demo
const FIREBASE_CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS
  || './scripts/service-account.json';
// ─────────────────────────────────────────────────────────────────────────────

const SENSOR_STATES = [
  // Simulate filling: sensor20→ON, water rises, sensor90→ON, pump ON
  { sensor20: false, sensor90: false, pump: 'OFF', label: 'Air rendah (<20%)' },
  { sensor20: true,  sensor90: false, pump: 'OFF', label: 'Air ~20-90% (sensor 20 aktif)' },
  { sensor20: true,  sensor90: false, pump: 'ON',  label: 'Pompa ON, level naik' },
  { sensor20: true,  sensor90: true,  pump: 'ON',  label: '⚠️ OVERFLOW RISK — 90% + pompa ON' },
  { sensor20: true,  sensor90: true,  pump: 'OFF', label: 'Toren penuh (90%)' },
  { sensor20: false, sensor90: true,  pump: 'OFF', label: 'Level turun dari penuh' },
  { sensor20: false, sensor90: false, pump: 'OFF', label: 'Air rendah — pompa dibutuhkan' },
];

function buildApp() {
  let serviceAccount;
  try {
    serviceAccount = require(FIREBASE_CREDENTIALS_PATH);
  } catch {
    console.error(`❌  Cannot load service account from: ${FIREBASE_CREDENTIALS_PATH}`);
    console.error('   Set GOOGLE_CREDENTIALS env var or save the JSON file there.');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://smart-water-tank-e49d6-default-rtdb.asia-southeast1.firebasedatabase.app',
  });

  return admin.firestore();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function seedTelemetry(db) {
  console.log('\n📡  Seeding telemetry_logs...');
  const col = db.collection('telemetry_logs');
  const batch = db.batch();

  // Generate 30 entries spanning 4 hours (every 8 minutes)
  const now = Date.now();
  const ENTRY_INTERVAL_MS = 8 * 60 * 1000; // 8 minutes
  const TOTAL_ENTRIES = 30;

  for (let i = TOTAL_ENTRIES - 1; i >= 0; i--) {
    const idx = i % SENSOR_STATES.length;
    const state = SENSOR_STATES[idx];
    const ts = now - (i * ENTRY_INTERVAL_MS);

    const docRef = col.doc(); // auto-generated ID

    // Simulate legacy field (sensor50Percent) for older entries
    const legacy50 = i > 25 && state.sensor20 === false && state.sensor90 === false;

    batch.set(docRef, {
      tankId: TANK_ID,
      sensor20Percent: state.sensor20,
      sensor50Percent: legacy50 ? true : false,
      sensor90Percent: state.sensor90,
      pumpStatusRead: state.pump,
      createdAt: admin.firestore.Timestamp.fromMillis(ts),
    });

    if (i % 400 === 0) {
      await batch.commit();
      console.log(`   ✓  Committed ${TOTAL_ENTRIES - i} / ${TOTAL_ENTRIES} entries`);
    }
  }

  await batch.commit();
  console.log(`   ✅  ${TOTAL_ENTRIES} telemetry entries created`);
}

async function seedAlarmSettings(db) {
  console.log('\n🔔  Seeding alarm_settings...');
  await db.doc(`alarm_settings/${TANK_ID}`).set({
    enabled: true,
    updatedBy: DEMO_UID,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('   ✅  Alarm settings created');
}

async function seedTankMembership(db) {
  console.log('\n👤  Seeding tank_members...');
  await db
    .doc(`tank_members/${TANK_ID}/members/${DEMO_UID}`)
    .set({
      active: true,
      isManager: true,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      displayName: 'Demo User',
    });

  // Also create the user document for AuthService lookups
  await db.doc(`users/${DEMO_UID}`).set({
    uid: DEMO_UID,
    email: 'demo@smartwatertank.app',
    displayName: 'Demo User',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('   ✅  Tank membership and user profile created');
}

async function seedNotifications(db) {
  console.log('\n🔔  Seeding user_notifications...');

  const notifications = [
    {
      type: 'LOW_LEVEL',
      severity: 'WARNING',
      title: 'Level air rendah',
      body: 'Level air berada di bawah 20% selama lebih dari 2 menit. Periksa kondisi pompa.',
      status: 'ACKNOWLEDGED',
      createdAtOffset: -2 * 60 * 60 * 1000, // 2 hours ago
    },
    {
      type: 'OVERFLOW',
      severity: 'CRITICAL',
      title: 'Peringatan potensi meluap',
      body: 'Sensor 90% aktif. Pastikan pompa sudah menyala atau cek keran pembuangan.',
      status: 'READ',
      createdAtOffset: -45 * 60 * 1000, // 45 min ago
    },
    {
      type: 'SENSOR_OFFLINE',
      severity: 'CRITICAL',
      title: 'Sensor terputus',
      body: 'Tidak ada telemetry baru selama 5 menit. Periksa koneksi ESP32.',
      status: 'NEW',
      createdAtOffset: -5 * 60 * 1000, // 5 min ago
    },
  ];

  for (const notif of notifications) {
    const docRef = db
      .collection('user_notifications')
      .doc(DEMO_UID)
      .collection('items')
      .doc();

    await docRef.set({
      tankId: TANK_ID,
      type: notif.type,
      severity: notif.severity,
      title: notif.title,
      body: notif.body,
      status: notif.status,
      createdAt: admin.firestore.Timestamp.fromMillis(
        Date.now() + notif.createdAtOffset,
      ),
      resolvedAt:
        notif.status === 'ACKNOWLEDGED'
          ? admin.firestore.Timestamp.fromMillis(Date.now() + notif.createdAtOffset + 30 * 60 * 1000)
          : null,
      readAt:
        notif.status === 'READ'
          ? admin.firestore.Timestamp.fromMillis(Date.now() + notif.createdAtOffset + 2 * 60 * 1000)
          : null,
    });
  }
  console.log(`   ✅  ${notifications.length} notifications created`);
}

async function seedSensor(db) {
  console.log('\n📊  Seeding tanks/{tankId}/sensors (realtime snapshot)...');
  await db.doc(`tanks/${TANK_ID}/sensors/latest`).set({
    sensor20Percent: true,
    sensor90Percent: false,
    pumpStatusRead: 'OFF',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('   ✅  Latest sensor snapshot created');
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  SmartWaterTank — Firestore Demo Data Seeder');
  console.log('═'.repeat(60));

  const db = buildApp();

  console.log(`\n🎯  Target tank: ${TANK_ID}`);
  console.log(`🎯  Demo UID:    ${DEMO_UID}`);

  try {
    await seedTelemetry(db);
    await seedAlarmSettings(db);
    await seedTankMembership(db);
    await seedNotifications(db);
    await seedSensor(db);

    console.log('\n' + '═'.repeat(60));
    console.log('  ✅  All demo data seeded successfully!');
    console.log('═'.repeat(60));
    console.log('\nNext steps:');
    console.log('  1. Sign in to the app with any email/password');
    console.log('  2. (First time only) Add your UID to tank_members manually');
    console.log('     or update DEMO_UID in this script to match your Auth UID');
    console.log('  3. Demo data will appear in Dashboard, History, and Notifications');
  } catch (err) {
    console.error('\n❌  Seeding failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
