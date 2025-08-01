import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types'; // Import User interface

export type GameStatus = 'active' | 'ended';

const GAME_STATUS_DOC = 'gameStatus';
const GAME_CONTROL_COLLECTION = 'gameControl';

// Collections to reset
const USERS_COLLECTION = 'users';
const QR_TOKENS_COLLECTION = 'qrTokens';
const PENDING_SCORES_COLLECTION = 'pendingScores';

// Import clear function
import { clearAllPendingScores } from './database';

export const getGameStatus = async (): Promise<GameStatus> => {
  try {
    const statusRef = doc(db, GAME_CONTROL_COLLECTION, GAME_STATUS_DOC);
    const statusDoc = await getDoc(statusRef);
    
    if (statusDoc.exists()) {
      return statusDoc.data().status || 'active';
    }
    
    // Default to active if no status found
    return 'active';
  } catch (error) {
    console.error('Error getting game status:', error);
    return 'active';
  }
};

export const setGameStatus = async (status: GameStatus): Promise<void> => {
  try {
    const statusRef = doc(db, GAME_CONTROL_COLLECTION, GAME_STATUS_DOC);
    await setDoc(statusRef, {
      status,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin'
    });
  } catch (error) {
    console.error('Error setting game status:', error);
    throw error;
  }
};

export const isGameActive = async (): Promise<boolean> => {
  const status = await getGameStatus();
  return status === 'active';
};

// Get the last reset timestamp from database
export const getLastResetTimestamp = async (): Promise<number | null> => {
  try {
    const resetRef = doc(db, GAME_CONTROL_COLLECTION, 'lastReset');
    const resetDoc = await getDoc(resetRef);

    if (resetDoc.exists()) {
      return resetDoc.data().timestamp || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting last reset timestamp:', error);
    return null;
  }
};

// Check if local storage needs to be cleared based on reset timestamp
export const checkAndClearLocalStorage = async (): Promise<boolean> => {
  try {
    const resetRef = doc(db, GAME_CONTROL_COLLECTION, 'lastReset');
    const resetDoc = await getDoc(resetRef);
    const lastResetTimestamp = resetDoc.exists() ? resetDoc.data().timestamp : null;
    const resetType = resetDoc.exists() ? resetDoc.data().resetBy : 'admin_full_reset'; // Default to full reset if not specified

    const userLoginTimestamp = localStorage.getItem('user_login_timestamp');

    if (lastResetTimestamp && userLoginTimestamp) {
      const userTimestamp = parseInt(userLoginTimestamp);

      // If database reset timestamp is newer than user's login timestamp, clear local storage
      if (lastResetTimestamp > userTimestamp) {
        console.log(`Clearing local storage due to game reset (type: ${resetType})`);

        // Always clear user_login_timestamp and session storage
        localStorage.removeItem('user_login_timestamp');
        sessionStorage.clear();

        // Only clear telegram_username and username if it was a full reset
        if (resetType === 'admin_full_reset') {
          localStorage.removeItem('telegram_username');
          localStorage.removeItem('username');
        }

        return true; // Indicates that storage was cleared
      }
    }

    return false; // No clearing needed
  } catch (error) {
    console.error('Error checking local storage:', error);
    return false;
  }
};

// Helper function to broadcast reset event
const broadcastResetEvent = (timestamp: number) => {
  localStorage.setItem('game_reset_timestamp', timestamp.toString());
  sessionStorage.setItem('game_reset_timestamp', timestamp.toString());
  window.dispatchEvent(new CustomEvent('gameReset', { 
    detail: { timestamp: timestamp } 
  }));
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('game_reset');
    channel.postMessage({ 
      type: 'GAME_RESET', 
      timestamp: timestamp 
    });
    channel.close();
  }
};

// Reset only scores and booths for all users
export const resetScoresAndBooths = async (): Promise<void> => {
  try {
    console.log('Starting score and booth reset...');

    // Store reset timestamp in database first
    const resetTimestamp = Date.now();
    const resetRef = doc(db, GAME_CONTROL_COLLECTION, 'lastReset');
    await setDoc(resetRef, {
      timestamp: resetTimestamp,
      resetAt: serverTimestamp(),
      resetBy: 'admin_partial_reset'
    });

    // Clear pending scores
    console.log('Clearing pending scores...');
    await clearAllPendingScores();

    // Clear QR tokens
    console.log('Clearing QR tokens...');
    await deleteCollection(QR_TOKENS_COLLECTION);

    // Reset scores and playedBooths for all users
    console.log('Resetting user scores and played booths...');
    const usersRef = collection(db, USERS_COLLECTION);
    const usersSnapshot = await getDocs(usersRef);
    const batch = writeBatch(db);
    let userUpdateCount = 0;

    usersSnapshot.docs.forEach(userDoc => {
      const userData = userDoc.data() as User;
      // Only reset if they have scores or played booths
      if (userData.totalScore > 0 || Object.keys(userData.playedBooths || {}).length > 0 || Object.keys(userData.scores || {}).length > 0) {
        batch.update(userDoc.ref, {
          totalScore: 0,
          playedBooths: {},
          scores: {}
        });
        userUpdateCount++;
      }
    });

    if (userUpdateCount > 0) {
      await batch.commit();
      console.log(`Updated ${userUpdateCount} users.`);
    } else {
      console.log('No users needed score/booth reset.');
    }

    // Broadcast reset event
    broadcastResetEvent(resetTimestamp);

    console.log('Score and booth reset completed successfully');
  } catch (error) {
    console.error('Error resetting scores and booths:', error);
    throw error;
  }
};

// Reset all game data
export const resetAllData = async (): Promise<void> => {
  try {
    console.log('Starting full game reset...');

    // Store reset timestamp in database first
    const resetTimestamp = Date.now();
    const resetRef = doc(db, GAME_CONTROL_COLLECTION, 'lastReset');
    await setDoc(resetRef, {
      timestamp: resetTimestamp,
      resetAt: serverTimestamp(),
      resetBy: 'admin_full_reset'
    });

    // Get all collections to delete
    const collectionsToDelete = [
      USERS_COLLECTION,
      QR_TOKENS_COLLECTION,
      PENDING_SCORES_COLLECTION
    ];

    // Delete all documents in batches
    for (const collectionName of collectionsToDelete) {
      console.log(`Deleting collection: ${collectionName}`);
      await deleteCollection(collectionName);
    }

    // Reset game status to active
    await setGameStatus('active');

    // Clear all localStorage data
    localStorage.removeItem('telegram_username');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_auth_timestamp');
    localStorage.removeItem('username'); // Also clear this key

    // Broadcast reset event
    broadcastResetEvent(resetTimestamp);

    console.log('Full game reset completed successfully');
  } catch (error) {
    console.error('Error resetting game data:', error);
    throw error;
  }
};

// Helper function to delete all documents in a collection
const deleteCollection = async (collectionName: string): Promise<void> => {
  let hasMore = true;
  let deletedCount = 0;

  while (hasMore) {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + batchSize);

      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += batchDocs.length;
      console.log(`Deleted batch ${Math.floor(i / batchSize) + 1} from ${collectionName} (${deletedCount} total)`);
    }

    // Check if there are more documents
    const remainingSnapshot = await getDocs(collectionRef);
    hasMore = !remainingSnapshot.empty;

    if (hasMore) {
      console.log(`Still ${remainingSnapshot.docs.length} documents remaining in ${collectionName}, continuing...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before next iteration
    }
  }

  console.log(`Finished deleting collection ${collectionName}. Total deleted: ${deletedCount}`);
};

// Check if QR scanning is allowed
export const isQRScanningAllowed = async (): Promise<boolean> => {
  return await isGameActive();
};

// Check if score allocation is allowed  
export const isScoreAllocationAllowed = async (): Promise<boolean> => {
  return await isGameActive();
};
