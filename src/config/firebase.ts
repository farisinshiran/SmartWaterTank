/**
 * Firebase Configuration Barrel
 *
 * Re-exports the initialized Firebase database and Firestore instances
 * for use by data services.
 */

import { getDatabase } from '@react-native-firebase/database';
import { getFirestore } from '@react-native-firebase/firestore';

export const database = getDatabase();
export const firestore = getFirestore();

export default database;

