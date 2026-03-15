import { useState, useEffect, useCallback } from 'react';

export default function useWakeLock() {
  const [wakeLock, setWakeLock] = useState(null);

  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Screen Wake Lock acquired');
        
        lock.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
          setWakeLock(null);
        });
      } else {
        console.log('Wake Lock API not supported');
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock !== null) {
      await wakeLock.release();
      setWakeLock(null);
    }
  }, [wakeLock]);

  // Re-acquire the lock if the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock, requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLock !== null) {
        wakeLock.release().catch(console.error);
      }
    };
  }, [wakeLock]);

  return { requestWakeLock, releaseWakeLock, isLocked: wakeLock !== null };
}
