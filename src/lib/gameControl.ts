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
import { User } from '../types'; // Import User type
import { getAllUsers } from './database'; // Import getAllUsers

// List of Telegram usernames to exclude from leaderboard and rewards
export const BLACKLISTED_USERS: string[] = [
  '@Trongsanght', 
  '@Loc',
  '@toanleo',
  '@Thuyminh',
  '@Copv',
  '@Lanhthu',
  '@Thinh',
  '@Bach300475',
  '@0904772373',
  '@youngcuncon'
  // Add more blacklisted usernames here
];

export type GameStatus = 'active' | 'ended';

// Define type for lucky winner
export interface LuckyWinner {
  telegram: string;
  mexcUID?: string;
  totalScore: number;
}

const GAME_STATUS_DOC = 'gameStatus';
const LUCKY_WINNERS_DOC = 'luckyWinners'; // New document for lucky winners
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

// Function to select and save lucky winners
export const selectAndSaveLuckyWinners = async (numberOfMinigames: number = 6, numberOfWinners: number = 7): Promise<LuckyWinner[]> => {
  try {
    console.log('Selecting and saving lucky winners...');
    const allUsers = await getAllUsers();

    // Sort all users by totalScore to identify top users
    const sortedAllUsers = [...allUsers].sort((a, b) => b.totalScore - a.totalScore);
    const top5Users = sortedAllUsers.slice(0, 5).map(user => user.telegram);

    // Filter users who have completed all minigames AND are not in the top 5
    const eligibleUsers = allUsers.filter(user => {
      const completedGamesCount = Object.keys(user.scores || {}).filter(key => user.scores![key] > 0).length;
      return completedGamesCount === numberOfMinigames 
             && !BLACKLISTED_USERS.includes(user.telegram)
             && !top5Users.includes(user.telegram); // Exclude top 5 users
    });

    // Shuffle eligible users and select the top N
    const shuffledUsers = eligibleUsers.sort(() => 0.5 - Math.random());
    const luckyWinners: LuckyWinner[] = shuffledUsers.slice(0, numberOfWinners).map(user => ({
      telegram: user.telegram,
      mexcUID: user.mexcUID,
      totalScore: user.totalScore,
    }));

    // Save lucky winners to Firestore
    const winnersRef = doc(db, GAME_CONTROL_COLLECTION, LUCKY_WINNERS_DOC);
    await setDoc(winnersRef, {
      winners: luckyWinners,
      selectedAt: serverTimestamp(),
      numberOfMinigamesCompleted: numberOfMinigames,
      numberOfWinnersSelected: numberOfWinners,
    });

    console.log(`Selected and saved ${luckyWinners.length} lucky winners.`);
    return luckyWinners;
  } catch (error) {
    console.error('Error selecting and saving lucky winners:', error);
    throw error;
  }
};

// Function to get lucky winners
export const getLuckyWinners = async (): Promise<{ winners: LuckyWinner[]; selectedAt: Date | null; numberOfMinigamesCompleted: number; numberOfWinnersSelected: number } | null> => {
  try {
    const winnersRef = doc(db, GAME_CONTROL_COLLECTION, LUCKY_WINNERS_DOC);
    const winnersDoc = await getDoc(winnersRef);

    if (winnersDoc.exists()) {
      const data = winnersDoc.data();
      return {
        winners: data.winners || [],
        selectedAt: data.selectedAt?.toDate() || null,
        numberOfMinigamesCompleted: data.numberOfMinigamesCompleted || 0,
        numberOfWinnersSelected: data.numberOfWinnersSelected || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting lucky winners:', error);
    return null;
  }
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

    // Broadcast reset event to all tabs/windows using multiple methods
    localStorage.setItem('game_reset_timestamp', resetTimestamp.toString());
    
    // Also use sessionStorage to ensure cross-tab communication
    sessionStorage.setItem('game_reset_timestamp', resetTimestamp.toString());
    
    // Dispatch custom event for immediate detection
    window.dispatchEvent(new CustomEvent('gameReset', { 
      detail: { timestamp: resetTimestamp } 
    }));

    // Use BroadcastChannel for better cross-tab communication
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('game_reset');
      channel.postMessage({ 
        type: 'GAME_RESET', 
        timestamp: resetTimestamp 
      });
      channel.close();
    }

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
