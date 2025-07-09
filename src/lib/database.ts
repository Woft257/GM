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
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { User } from '../types';

// Collections
const USERS_COLLECTION = 'users';
const QR_TOKENS_COLLECTION = 'qr-tokens';

// User operations
export const createUser = async (telegram: string): Promise<User> => {
  const userRef = doc(db, USERS_COLLECTION, telegram);
  const userDoc = await getDoc(userRef);
  
  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      telegram: data.telegram,
      totalScore: data.totalScore || 0,
      playedBooths: data.playedBooths || {},
      createdAt: data.createdAt?.toDate() || new Date()
    };
  }
  
  const newUser: User = {
    telegram,
    totalScore: 0,
    playedBooths: {},
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
    totalScore: data.totalScore || 0,
    playedBooths: data.playedBooths || {},
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
      totalScore: data.totalScore || 0,
      playedBooths: data.playedBooths || {},
      createdAt: data.createdAt?.toDate() || new Date()
    };
  });
};

// Real-time leaderboard subscription
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
        totalScore: data.totalScore || 0,
        playedBooths: data.playedBooths || {},
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });
    callback(users);
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

  while (!isUnique) {
    // Generate 6-digit random number
    code = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if code already exists in active tokens
    const tokensRef = collection(db, QR_TOKENS_COLLECTION);
    const now = new Date();
    const q = query(
      tokensRef,
      where('simpleCode', '==', code),
      where('expiresAt', '>', Timestamp.fromDate(now)),
      where('used', '==', false)
    );

    const existingTokens = await getDocs(q);
    isUnique = existingTokens.empty;
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

export const useQRToken = async (tokenId: string, telegram: string): Promise<number> => {
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
export const useQRTokenBySimpleCode = async (simpleCode: string, telegram: string): Promise<number> => {
  const tokensRef = collection(db, QR_TOKENS_COLLECTION);
  const now = new Date();

  // Find active token with this simple code
  const q = query(
    tokensRef,
    where('simpleCode', '==', simpleCode),
    where('used', '==', false),
    where('expiresAt', '>', Timestamp.fromDate(now))
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    throw new Error('Mã không hợp lệ hoặc đã hết hạn');
  }

  const tokenDoc = querySnapshot.docs[0];
  const tokenData = tokenDoc.data();

  // Update user score
  await updateUserScore(telegram, tokenData.boothId, tokenData.points);

  // Mark token as used
  await updateDoc(tokenDoc.ref, {
    used: true,
    usedAt: serverTimestamp(),
    usedBy: telegram
  });

  return tokenData.points;
};

// Function to clean up expired tokens
export const cleanupExpiredTokens = async (): Promise<void> => {
  const tokensRef = collection(db, QR_TOKENS_COLLECTION);
  const now = new Date();

  const q = query(
    tokensRef,
    where('expiresAt', '<=', Timestamp.fromDate(now)),
    where('used', '==', false)
  );

  const expiredTokens = await getDocs(q);

  const deletePromises = expiredTokens.docs.map(doc =>
    updateDoc(doc.ref, { used: true, usedBy: 'EXPIRED' })
  );

  await Promise.all(deletePromises);
  console.log(`Cleaned up ${expiredTokens.size} expired tokens`);
};
