import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PendingScore } from '../types';

const PENDING_SCORES_COLLECTION = 'pending-scores';

export const usePendingScores = (userTelegram: string | null) => {
  const [pendingScores, setPendingScores] = useState<PendingScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userTelegram) {
      setPendingScores([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, PENDING_SCORES_COLLECTION),
      where('userTelegram', '==', userTelegram),
      where('status', '==', 'waiting')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scores = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          boothId: data.boothId,
          userTelegram: data.userTelegram,
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
  }, [userTelegram]);

  return { pendingScores, loading };
};
