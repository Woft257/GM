import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GameStatus, getGameStatus } from '../lib/gameControl';

const GAME_STATUS_DOC = 'gameStatus';
const GAME_CONTROL_COLLECTION = 'gameControl';

export const useGameStatus = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        // Get initial status
        const initialStatus = await getGameStatus();
        setGameStatus(initialStatus);
        setLoading(false);

        // Set up real-time listener
        const statusRef = doc(db, GAME_CONTROL_COLLECTION, GAME_STATUS_DOC);
        unsubscribe = onSnapshot(statusRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const newStatus = data.status || 'active';
            setGameStatus(newStatus);
          } else {
            setGameStatus('active');
          }
        }, (error) => {
          console.error('Error listening to game status:', error);
        });

      } catch (error) {
        console.error('Error setting up game status listener:', error);
        setGameStatus('active');
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { gameStatus, loading };
};
