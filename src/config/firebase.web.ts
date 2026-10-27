import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCJ_Aq79fLcwGCgtZLBd-wcrKCwUpzCcHM',
  authDomain: 'smart-water-tank-e49d6.firebaseapp.com',
  databaseURL:
    'https://smart-water-tank-e49d6-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'smart-water-tank-e49d6',
  messagingSenderId: '1093326028578',
  appId: '1:1093326028578:web:3e14241e31690859662f7b',
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const database = getDatabase(firebaseApp);
export const firestore = initializeFirestore(firebaseApp, {
  experimentalAutoDetectLongPolling: true,
});
export const auth = getAuth(firebaseApp);
export const WEB_PUSH_VAPID_KEY = 'BLvWmaBoJ5ojMVhyN6jzZgp8S-UIwKfIRIn0DIgseEHfG8k4VmL3ZpC0BTCrdzE5DHzSH590eQSPt7RWHkjREV0';

export default database;
