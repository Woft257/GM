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
          where('username', '==', username)
        )
      : query(
          collection(db, PENDING_SCORES_COLLECTION)
        );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const allScores = querySnapshot.docs.map(doc => {
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
      // Filter on client side to ensure 'waiting' status or missing status are included
      const filteredScores = allScores.filter(score => score.status === 'waiting' || !score.status);
      setPendingScores(filteredScores);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [username]);

  return { pendingScores, loading };
};
