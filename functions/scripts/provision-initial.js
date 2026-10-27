const { applicationDefault, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

const PROJECT_ID = 'smart-water-tank-e49d6';
const TANK_ID = 'toren-gedung-a-01';

function parseArguments(args) {
  const members = new Set();
  const managers = new Set();
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (argument !== '--member' && argument !== '--manager') {
      throw new Error(`Argumen tidak dikenal: ${argument}`);
    }

    const uid = args[index + 1];
    if (!uid || uid.startsWith('--') || uid.length > 128 || /\s/.test(uid)) {
      throw new Error(`UID tidak valid untuk ${argument}.`);
    }
    index += 1;
    (argument === '--member' ? members : managers).add(uid);
  }

  if (members.size === 0) {
    throw new Error('Tambahkan minimal satu --member <AUTH_UID>.');
  }
  for (const uid of managers) {
    if (!members.has(uid)) {
      throw new Error(`Manager ${uid} juga harus tercantum sebagai --member.`);
    }
  }

  return { members, managers, dryRun };
}

async function provision({ members, managers, dryRun }) {
  const plan = {
    projectId: PROJECT_ID,
    tankId: TANK_ID,
    alarmDocument: {
      enabled: true,
      lowThresholdPercent: 20,
      highThresholdPercent: 90,
      lowDurationSeconds: 120,
      sensorTimeoutSeconds: 300,
      criticalRepeatMinutes: 15,
    },
    members: [...members].map((uid) => ({
      uid,
      active: true,
      isManager: managers.has(uid),
    })),
  };

  if (dryRun) {
    console.log('Dry run; tidak ada dokumen yang ditulis.');
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });
  const auth = getAuth();
  const db = getFirestore();

  for (const uid of members) {
    await auth.getUser(uid);
  }

  const alarmRef = db.collection('alarm_settings').doc(TANK_ID);
  const memberRefs = [...members].map((uid) => ({
    uid,
    ref: db.collection('tank_members').doc(TANK_ID).collection('members').doc(uid),
    isManager: managers.has(uid),
  }));

  await db.runTransaction(async (transaction) => {
    const alarmSnapshot = await transaction.get(alarmRef);
    const memberSnapshots = [];
    for (const member of memberRefs) {
      memberSnapshots.push({
        ...member,
        snapshot: await transaction.get(member.ref),
      });
    }

    if (alarmSnapshot.exists) {
      throw new Error(
        `alarm_settings/${TANK_ID} sudah ada; skrip tidak mengubah dokumen yang ada.`,
      );
    }
    const conflict = memberSnapshots.find(({ snapshot, isManager }) =>
      snapshot.exists &&
      (snapshot.get('active') !== true || snapshot.get('isManager') !== isManager));
    if (conflict) {
      throw new Error(
        `Keanggotaan ${conflict.uid} sudah ada dengan nilai berbeda; tidak ada dokumen yang ditulis.`,
      );
    }

    transaction.create(alarmRef, {
      ...plan.alarmDocument,
      updatedBy: 'bootstrap-admin',
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (const { uid, ref, isManager, snapshot } of memberSnapshots) {
      if (!snapshot.exists) {
        transaction.create(ref, { active: true, isManager });
      }
    }
  });

  console.log(`Provisioning selesai untuk project ${PROJECT_ID}, toren ${TANK_ID}.`);
}

try {
  const options = parseArguments(process.argv.slice(2));
  provision(options).catch((error) => {
    console.error('Provisioning gagal:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
} catch (error) {
  console.error('Argumen provisioning tidak valid:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
