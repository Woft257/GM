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

// Reset all game data
export const resetAllData = async (): Promise<void> => {
  try {
    console.log('Starting game reset...');
    
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
    }

    // Reset game status to active
    await setGameStatus('active');
    
    console.log('Game reset completed successfully');
  } catch (error) {
    console.error('Error resetting game data:', error);
    throw error;
  }
};

// Helper function to delete all documents in a collection
const deleteCollection = async (collectionName: string): Promise<void> => {
  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);
  
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
    console.log(`Deleted batch ${Math.floor(i / batchSize) + 1} from ${collectionName}`);
  }
};

// Check if QR scanning is allowed
export const isQRScanningAllowed = async (): Promise<boolean> => {
  return await isGameActive();
};

// Check if score allocation is allowed  
export const isScoreAllocationAllowed = async (): Promise<boolean> => {
  return await isGameActive();
};
