import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PendingScore } from '../types';

const PENDING_SCORES_COLLECTION = 'pending-scores';

export const usePendingScores = (username: string | null = null) => {
  const [pendingScores, setPendingScores] = useState<PendingScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If username is provided, filter by user, otherwise get all pending scores
    const q = username
      ? query(
          collection(db, PENDING_SCORES_COLLECTION),
          where('username', '==', username),
          where('status', '==', 'waiting')
        )
      : query(
          collection(db, PENDING_SCORES_COLLECTION),
          where('status', '==', 'waiting')
        );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scores = querySnapshot.docs.map(doc => {
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
      setPendingScores(scores);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [username]);

  return { pendingScores, loading };
};
