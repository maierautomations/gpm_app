import { InteractionManager } from 'react-native';

/**
 * Defers callback execution until after interactions complete (React Native best practice)
 * Falls back to setTimeout if InteractionManager unavailable
 *
 * Use for non-critical initialization that shouldn't block UI
 */
export function deferToInteractive(callback: () => void | Promise<void>): void {
  if (InteractionManager && InteractionManager.runAfterInteractions) {
    // React Native: Run after current interactions (animations, gestures) complete
    InteractionManager.runAfterInteractions(() => {
      callback();
    });
  } else {
    // Fallback: Short delay to let UI become interactive first
    setTimeout(callback, 150);
  }
}

/**
 * Defer with longer delay for truly non-critical tasks
 */
export function deferToIdle(callback: () => void | Promise<void>): void {
  setTimeout(callback, 1000); // 1 second after app starts
}
