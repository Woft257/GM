import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

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
    const lastResetTimestamp = await getLastResetTimestamp();
    const userLoginTimestamp = localStorage.getItem('user_login_timestamp');

    if (lastResetTimestamp && userLoginTimestamp) {
      const userTimestamp = parseInt(userLoginTimestamp);

      // If database reset timestamp is newer than user's login timestamp, clear local storage
      if (lastResetTimestamp > userTimestamp) {
        console.log('Clearing local storage due to game reset');

        // Clear all user-related local storage
        localStorage.removeItem('telegram_username');
        localStorage.removeItem('username');
        localStorage.removeItem('user_login_timestamp');

        // Clear session storage as well
        sessionStorage.clear();

        return true; // Indicates that storage was cleared
      }
    }

    return false; // No clearing needed
  } catch (error) {
    console.error('Error checking local storage:', error);
    return false;
  }
};

// Reset all game data
export const resetAllData = async (): Promise<void> => {
  try {
    console.log('Starting game reset...');

    // Store reset timestamp in database first
    const resetTimestamp = Date.now();
    const resetRef = doc(db, GAME_CONTROL_COLLECTION, 'lastReset');
    await setDoc(resetRef, {
      timestamp: resetTimestamp,
      resetAt: serverTimestamp(),
      resetBy: 'admin'
    });

    // First, explicitly clear pending scores using the dedicated function
    console.log('Clearing pending scores with dedicated function...');
    await clearAllPendingScores();

    // Get all collections to delete
    const collections = [
      USERS_COLLECTION,
      QR_TOKENS_COLLECTION,
      PENDING_SCORES_COLLECTION
    ];

    // Delete all documents in batches
    for (const collectionName of collections) {
      console.log(`Deleting collection: ${collectionName}`);
      await deleteCollection(collectionName);

      // Wait a bit to ensure deletion is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify deletion by checking if collection is empty
      const verifyRef = collection(db, collectionName);
      const verifySnapshot = await getDocs(verifyRef);
      console.log(`Collection ${collectionName} has ${verifySnapshot.docs.length} documents remaining`);

      // If still has documents, try one more time
      if (verifySnapshot.docs.length > 0) {
        console.log(`Retrying deletion for ${collectionName}...`);
        await deleteCollection(collectionName);
      }
    }

    // Reset game status to active
    await setGameStatus('active');

    // Clear all localStorage data
    localStorage.removeItem('telegram_username');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_auth_timestamp');
    localStorage.removeItem('username'); // Also clear this key

    // Broadcast reset event to all tabs/windows
    localStorage.setItem('game_reset_timestamp', resetTimestamp.toString());

    console.log('Game reset completed successfully');
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
