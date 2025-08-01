import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  writeBatch,
  deleteField,
  QueryDocumentSnapshot,
  DocumentData,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { User, PendingScore } from '../types';
import { isGameActive } from './gameControl';

// Collections
const USERS_COLLECTION = 'users';
const QR_TOKENS_COLLECTION = 'qr-tokens';
const PENDING_SCORES_COLLECTION = 'pending-scores';
const ADMIN_CONTROLS_COLLECTION = 'admin-controls';

// User operations
export const createUser = async (telegram: string, mexcUID?: string): Promise<User> => {
  const userRef = doc(db, USERS_COLLECTION, telegram);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    // If user exists, update mexcUID if provided and different
    if (mexcUID && data.mexcUID !== mexcUID) {
      await updateDoc(userRef, { mexcUID });
    }
    return {
      telegram: data.telegram,
      mexcUID: data.mexcUID || undefined,
      totalScore: data.totalScore || 0,
      playedBooths: data.playedBooths || {},
      scores: data.scores || {},
      rewards: data.rewards || {},
      createdAt: data.createdAt?.toDate() || new Date()
    };
  }

  // Check if game is still active before creating new user
  const gameActive = await isGameActive();
  if (!gameActive) {
    throw new Error('Sự kiện đã kết thúc. Không thể đăng ký mới.');
  }

  const newUser: User = {
    telegram,
    mexcUID: mexcUID || undefined,
    totalScore: 0,
    playedBooths: {},
    scores: {},
    rewards: {},
    createdAt: new Date()
  };

  await setDoc(userRef, {
    ...newUser,
    createdAt: serverTimestamp()
  });

  return newUser;
};

export const getUser = async (telegram: string): Promise<User | null> => {
  const userRef = doc(db, USERS_COLLECTION, telegram);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }
  
  const data = userDoc.data();
  return {
    telegram: data.telegram,
    mexcUID: data.mexcUID || undefined,
    totalScore: data.totalScore || 0,
    playedBooths: data.playedBooths || {},
    scores: data.scores || {},
    createdAt: data.createdAt?.toDate() || new Date()
  };
};

export const updateUserScore = async (
  telegram: string, 
  boothId: string, 
  points: number
): Promise<void> => {
  const userRef = doc(db, USERS_COLLECTION, telegram);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  const currentScore = userData.totalScore || 0;
  const playedBooths = userData.playedBooths || {};
  
  // Check if booth already played
  if (playedBooths[boothId]) {
    throw new Error('Booth already completed');
  }
  
  await updateDoc(userRef, {
    totalScore: currentScore + points,
    [`playedBooths.${boothId}`]: true
  });
};

export const getLeaderboard = async (limitCount: number = 10): Promise<User[]> => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('totalScore', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      telegram: data.telegram,
      mexcUID: data.mexcUID || undefined,
      totalScore: data.totalScore || 0,
      playedBooths: data.playedBooths || {},
      scores: data.scores || {},
      createdAt: data.createdAt?.toDate() || new Date()
    };
  });
};

// Get ALL users (no limit)
export const getAllUsers = async (): Promise<User[]> => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('totalScore', 'desc')); // No limit
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      telegram: data.telegram,
      mexcUID: data.mexcUID || undefined,
      totalScore: data.totalScore || 0,
      playedBooths: data.playedBooths || {},
      scores: data.scores || {},
      createdAt: data.createdAt?.toDate() || new Date()
    };
  });
};

// Real-time leaderboard subscription (limited)
export const subscribeToLeaderboard = (
  callback: (users: User[]) => void,
  limitCount: number = 10
) => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('totalScore', 'desc'), limit(limitCount));

  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        telegram: data.telegram,
        mexcUID: data.mexcUID || undefined,
        totalScore: data.totalScore || 0,
        playedBooths: data.playedBooths || {},
        scores: data.scores || {},
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    callback(users);
  });
};

// Real-time ALL users subscription (no limit)
export const subscribeToAllUsers = (
  callback: (users: User[]) => void
) => {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, orderBy('totalScore', 'desc')); // No limit

  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        telegram: data.telegram,
        mexcUID: data.mexcUID || undefined,
        totalScore: data.totalScore || 0,
        playedBooths: data.playedBooths || {},
        scores: data.scores || {},
        rewards: data.rewards || {},
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    callback(users);
  });
};

// Real-time user subscription
export const subscribeToUser = (
  telegram: string,
  callback: (user: User | null) => void
) => {
  const userRef = doc(db, USERS_COLLECTION, telegram);

  return onSnapshot(userRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const user: User = {
        telegram: data.telegram,
        mexcUID: data.mexcUID || undefined,
        totalScore: data.totalScore || 0,
        playedBooths: data.playedBooths || {},
        scores: data.scores || {},
        rewards: data.rewards || {},
        createdAt: data.createdAt?.toDate() || new Date()
      };
      callback(user);
    } else {
      callback(null);
    }
  });
};

// Get ALL QR Tokens
export const getAllQRTokens = async (): Promise<QRToken[]> => {
  const tokensRef = collection(db, QR_TOKENS_COLLECTION);
  const q = query(tokensRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.id,
      boothId: data.boothId,
      points: data.points,
      used: data.used,
      createdAt: data.createdAt?.toDate() || new Date(),
      usedAt: data.usedAt?.toDate(),
      usedBy: data.usedBy,
      expiresAt: data.expiresAt?.toDate() || new Date(),
      simpleCode: data.simpleCode || ''
    };
  });
};

// Get ALL Pending Scores
export const getAllPendingScores = async (): Promise<PendingScore[]> => {
  const pendingScoresRef = collection(db, PENDING_SCORES_COLLECTION);
  const q = query(pendingScoresRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: data.id,
      boothId: data.boothId,
      username: data.username,
      timestamp: data.timestamp,
      status: data.status,
      points: data.points,
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      completedBy: data.completedBy
    };
  });
};

// QR Token operations
export interface QRToken {
  id: string;
  boothId: string;
  points: number;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
  usedBy?: string;
  expiresAt: Date; // Hết hạn sau 15 phút
  simpleCode: string; // 6 số để nhập thủ công
}

// Generate unique 6-digit code
const generateSimpleCode = async (): Promise<string> => {
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-digit random number
    code = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // Simple check - just check if code exists (without complex query)
      const tokensRef = collection(db, QR_TOKENS_COLLECTION);
      const q = query(tokensRef, where('simpleCode', '==', code));
      const existingTokens = await getDocs(q);

      // If no existing tokens with this code, it's unique
      isUnique = existingTokens.empty;

      // If not unique, check if existing tokens are expired/used
      if (!isUnique) {
        const now = new Date();
        let hasActiveToken = false;

        existingTokens.forEach(doc => {
          const data = doc.data();
          const expiresAt = data.expiresAt?.toDate();
          if (!data.used && expiresAt && now < expiresAt) {
            hasActiveToken = true;
          }
        });

        isUnique = !hasActiveToken;
      }
    } catch (error) {
      console.warn('Error checking code uniqueness:', error);
      // If error, just use the code (low chance of collision)
      isUnique = true;
    }

    attempts++;
  }

  return code!;
};

export const createQRToken = async (boothId: string, points: number): Promise<{ tokenId: string; simpleCode: string }> => {
  const tokenId = `${boothId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const simpleCode = await generateSimpleCode();
  const tokenRef = doc(db, QR_TOKENS_COLLECTION, tokenId);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút

  await setDoc(tokenRef, {
    id: tokenId,
    boothId,
    points,
    used: false,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    simpleCode
  });

  return { tokenId, simpleCode };
};

export const processQRToken = async (tokenId: string, telegram: string): Promise<number> => {
  const tokenRef = doc(db, QR_TOKENS_COLLECTION, tokenId);
  const tokenDoc = await getDoc(tokenRef);

  if (!tokenDoc.exists()) {
    throw new Error('QR token not found');
  }

  const tokenData = tokenDoc.data();

  if (tokenData.used) {
    throw new Error('QR token already used');
  }

  // Check if token is expired (15 minutes)
  const expiresAt = tokenData.expiresAt?.toDate();
  const now = new Date();

  if (now > expiresAt) {
    throw new Error('QR token expired');
  }

  // Update user score
  await updateUserScore(telegram, tokenData.boothId, tokenData.points);

  // Mark token as used
  await updateDoc(tokenRef, {
    used: true,
    usedAt: serverTimestamp(),
    usedBy: telegram
  });

  return tokenData.points;
};

export const getQRToken = async (tokenId: string): Promise<QRToken | null> => {
  const tokenRef = doc(db, QR_TOKENS_COLLECTION, tokenId);
  const tokenDoc = await getDoc(tokenRef);

  if (!tokenDoc.exists()) {
    return null;
  }

  const data = tokenDoc.data();
  return {
    id: data.id,
    boothId: data.boothId,
    points: data.points,
    used: data.used,
    createdAt: data.createdAt?.toDate() || new Date(),
    usedAt: data.usedAt?.toDate(),
    usedBy: data.usedBy,
    expiresAt: data.expiresAt?.toDate() || new Date(),
    simpleCode: data.simpleCode || ''
  };
};

// Function to use QR token by simple code
export const processQRTokenBySimpleCode = async (simpleCode: string, telegram: string): Promise<number> => {
  const tokensRef = collection(db, QR_TOKENS_COLLECTION);
  const now = new Date();

  try {
    // Find token with this simple code
    const q = query(tokensRef, where('simpleCode', '==', simpleCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Mã không hợp lệ');
    }

    // Check each token to find valid one
    let validToken = null;
    let validTokenData = null;

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();

      if (!data.used && expiresAt && now < expiresAt) {
        validToken = doc;
        validTokenData = data;
        break;
      }
    }

    if (!validToken || !validTokenData) {
      throw new Error('Mã đã được sử dụng hoặc đã hết hạn');
    }

    // Update user score
    await updateUserScore(telegram, validTokenData.boothId, validTokenData.points);

    // Mark token as used
    await updateDoc(validToken.ref, {
      used: true,
      usedAt: serverTimestamp(),
      usedBy: telegram
    });

    return validTokenData.points;
  } catch (error) {
    console.error('Error using simple code:', error);
    throw error;
  }
};

// Function to clean up expired tokens (simplified to avoid index requirements)
export const cleanupExpiredTokens = async (): Promise<void> => {
  try {
    const tokensRef = collection(db, QR_TOKENS_COLLECTION);
    const now = new Date();

    // Get all unused tokens
    const q = query(tokensRef, where('used', '==', false));
    const allTokens = await getDocs(q);

    const expiredTokens: QueryDocumentSnapshot<DocumentData>[] = [];

    // Filter expired tokens manually
    allTokens.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();

      if (expiresAt && now > expiresAt) {
        expiredTokens.push(doc);
      }
    });

    // Mark expired tokens as used
    const deletePromises = expiredTokens.map(doc =>
      updateDoc(doc.ref, { used: true, usedBy: 'EXPIRED' })
    );

    await Promise.all(deletePromises);
    console.log(`Cleaned up ${expiredTokens.length} expired tokens`);
  } catch (error) {
    console.error('Cleanup error:', error);
    // Don't throw error to avoid breaking the app
  }
};

// PendingScore operations
export const createPendingScore = async (boothId: string, username: string): Promise<string> => {
  // Check if user already has pending score for this booth
  const existingQuery = query(
    collection(db, PENDING_SCORES_COLLECTION),
    where('boothId', '==', boothId),
    where('username', '==', username),
    where('status', '==', 'waiting')
  );

  const existingDocs = await getDocs(existingQuery);
  if (!existingDocs.empty) {
    throw new Error('Bạn đã quét QR code của booth này và đang chờ phân bổ điểm');
  }

  const timestamp = Date.now();
  const pendingId = `${boothId}_${username}_${timestamp}`;
  const pendingRef = doc(db, PENDING_SCORES_COLLECTION, pendingId);

  const pendingScore: Omit<PendingScore, 'id'> = {
    boothId,
    username,
    timestamp,
    status: 'waiting',
    createdAt: new Date()
  };

  await setDoc(pendingRef, {
    ...pendingScore,
    id: pendingId,
    createdAt: serverTimestamp()
  });

  return pendingId;
};

export const getPendingScore = async (pendingId: string): Promise<PendingScore | null> => {
  const pendingRef = doc(db, PENDING_SCORES_COLLECTION, pendingId);
  const pendingDoc = await getDoc(pendingRef);

  if (!pendingDoc.exists()) {
    return null;
  }

  const data = pendingDoc.data();
  return {
    id: data.id,
    boothId: data.boothId,
    username: data.username,
    timestamp: data.timestamp,
    status: data.status,
    points: data.points,
    createdAt: data.createdAt?.toDate() || new Date(),
    completedAt: data.completedAt?.toDate(),
    completedBy: data.completedBy
  };
};

export const getPendingScoresByBooth = async (boothId: string): Promise<PendingScore[]> => {
  const q = query(
    collection(db, PENDING_SCORES_COLLECTION),
    where('boothId', '==', boothId),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: data.id,
    boothId: data.boothId,
    username: data.username,
    timestamp: data.timestamp,
    status: data.status,
    points: data.points,
      createdAt: data.createdAt?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
      completedBy: data.completedBy
    };
  });
};

export const completePendingScore = async (
  pendingId: string,
  points: number,
  adminTelegram: string
): Promise<void> => {
  const pendingRef = doc(db, PENDING_SCORES_COLLECTION, pendingId);
  const pendingDoc = await getDoc(pendingRef);

  if (!pendingDoc.exists()) {
    throw new Error('Pending score not found');
  }

  const pendingData = pendingDoc.data();
  if (pendingData.status !== 'waiting') {
    throw new Error('Pending score already processed');
  }

  // Use batch for atomic operations
  const batch = writeBatch(db);

  // Update user score
  const userRef = doc(db, USERS_COLLECTION, pendingData.username);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const userData = userDoc.data();
    const currentScores = userData.scores || {};
    const newScores = { ...currentScores, [pendingData.boothId]: points };
    const newTotalScore = (Object.values(newScores) as number[]).reduce((sum: number, score: number) => sum + (score || 0), 0);

    batch.update(userRef, {
      scores: newScores,
      totalScore: newTotalScore,
      [`playedBooths.${pendingData.boothId}`]: true, // Mark booth as completed
      lastUpdated: serverTimestamp()
    });
  }

  // Mark pending score as completed
  batch.update(pendingRef, {
    status: 'completed',
    points,
    completedAt: serverTimestamp(),
    completedBy: adminTelegram
  });

  // Commit batch
  await batch.commit();
};

export const subscribeToPendingScore = (
  pendingId: string,
  callback: (pendingScore: PendingScore | null) => void
) => {
  const pendingRef = doc(db, PENDING_SCORES_COLLECTION, pendingId);

  return onSnapshot(pendingRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const pendingScore: PendingScore = {
        id: data.id,
        boothId: data.boothId,
        username: data.username,
        timestamp: data.timestamp,
        status: data.status,
        points: data.points,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        completedBy: data.completedBy
      };
      callback(pendingScore);
    } else {
      callback(null);
    }
  });
};

export const subscribeToPendingScoresByBooth = (
  boothId: string,
  callback: (pendingScores: PendingScore[]) => void
) => {
  const q = query(
    collection(db, PENDING_SCORES_COLLECTION),
    where('boothId', '==', boothId),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const pendingScores = querySnapshot.docs.map(doc => {
  const data = doc.data();
  return {
    id: data.id,
    boothId: data.boothId,
    username: data.username,
    timestamp: data.timestamp,
    status: data.status,
    points: data.points,
        createdAt: data.createdAt?.toDate() || new Date(),
        completedAt: data.completedAt?.toDate(),
        completedBy: data.completedBy
      };
    });
    callback(pendingScores);
  });
};

// Admin functions for score management
export const updateUserScoreAdmin = async (telegram: string, boothId: string, points: number): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, telegram);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentScores = userData.scores || {};
      const newScores = { ...currentScores, [boothId]: points };
      const newTotalScore = (Object.values(newScores) as number[]).reduce((sum: number, score: number) => sum + (score || 0), 0);

      await updateDoc(userRef, {
        scores: newScores,
        totalScore: newTotalScore,
        [`playedBooths.${boothId}`]: true,
        lastUpdated: serverTimestamp()
      });
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error updating user score:', error);
    throw error;
  }
};

export const deleteUserScoreAdmin = async (telegram: string, boothId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, telegram);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentScores = userData.scores || {};
      const newScores = { ...currentScores };
      delete newScores[boothId];

      const newTotalScore = (Object.values(newScores) as number[]).reduce((sum: number, score: number) => sum + (score || 0), 0);

      await updateDoc(userRef, {
        scores: newScores,
        totalScore: newTotalScore,
        [`playedBooths.${boothId}`]: deleteField(),
        lastUpdated: serverTimestamp()
      });
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error deleting user score:', error);
    throw error;
  }
};

// Allocate score for a specific minigame
export const allocateScore = async (username: string, boothId: string, minigameId: string, score: number): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Update user's score
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentScores = userData.scores || {};

    // Update minigame score
    const newScores = {
      ...currentScores,
      [minigameId]: score
    };

    // Calculate new total score
    const newTotalScore = (Object.values(newScores) as number[]).reduce((sum: number, s: number) => sum + (s || 0), 0);

    // Update user document
    batch.update(userRef, {
      scores: newScores,
      totalScore: newTotalScore,
      [`playedBooths.${boothId}`]: true,
      lastUpdated: serverTimestamp()
    });

    // Remove pending score
    const pendingScoresQuery = query(
      collection(db, PENDING_SCORES_COLLECTION),
      where('username', '==', username),
      where('boothId', '==', boothId)
    );

    const pendingScoresSnapshot = await getDocs(pendingScoresQuery);
    pendingScoresSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error allocating score:', error);
    throw error;
  }
};

// Update user reward status
export const updateUserReward = async (username: string, rewardId: string, claimed: boolean): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, username);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentRewards = userData.rewards || {};

    const newRewards = {
      ...currentRewards,
      [rewardId]: claimed
    };

    await updateDoc(userRef, {
      rewards: newRewards,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user reward:', error);
    throw error;
  }
};

// Admin control functions
export const triggerGlobalReload = async (): Promise<void> => {
  try {
    const adminControlsRef = doc(db, ADMIN_CONTROLS_COLLECTION, 'globalSettings');
    await setDoc(adminControlsRef, { reloadTrigger: serverTimestamp() }, { merge: true });
    console.log('Global reload triggered successfully.');
  } catch (error) {
    console.error('Error triggering global reload:', error);
    throw error;
  }
};

export const subscribeToGlobalReload = (callback: (timestamp: Date | null) => void) => {
  const adminControlsRef = doc(db, ADMIN_CONTROLS_COLLECTION, 'globalSettings');
  return onSnapshot(adminControlsRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const reloadTimestamp = data.reloadTrigger?.toDate() || null;
      callback(reloadTimestamp);
    } else {
      callback(null);
    }
  });
};

// Function to clear all pending scores (for reset)
export const deletePendingScore = async (pendingScoreId: string): Promise<void> => {
  try {
    const pendingRef = doc(db, PENDING_SCORES_COLLECTION, pendingScoreId);
    await deleteDoc(pendingRef);
    console.log(`Pending score ${pendingScoreId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting pending score ${pendingScoreId}:`, error);
    throw error;
  }
};

export const clearAllPendingScores = async (): Promise<void> => {
  try {
    console.log('Clearing all pending scores...');
    const pendingScoresRef = collection(db, PENDING_SCORES_COLLECTION);
    const snapshot = await getDocs(pendingScoresRef);

    if (snapshot.empty) {
      console.log('No pending scores to clear');
      return;
    }

    const batchSize = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + batchSize);

      batchDocs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Deleted ${batchDocs.length} pending scores`);
    }

    console.log(`Cleared all ${docs.length} pending scores`);
  } catch (error) {
    console.error('Cleanup error:', error);
    throw error;
  }
};
