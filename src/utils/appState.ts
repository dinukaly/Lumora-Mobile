import { AppState, type AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';

export function useOnAppResume(onResume: () => void) {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (didResume(previousAppState, nextAppState)) {
        onResume();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onResume]);
}

function didResume(
  previousAppState: AppStateStatus,
  nextAppState: AppStateStatus,
) {
  return (
    (previousAppState === 'background' || previousAppState === 'inactive') &&
    nextAppState === 'active'
  );
}
