import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * ErrorBoundaryTest Component
 *
 * This component is for testing the ErrorBoundary.
 * It intentionally throws an error when the "Throw Error" button is clicked.
 *
 * USAGE (for testing only):
 * Import this in any screen and add: <ErrorBoundaryTest />
 *
 * IMPORTANT: Remove this component after testing!
 */
export default function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    // This will be caught by ErrorBoundary
    throw new Error('Test error: ErrorBoundary is working correctly! 🎉');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Error Boundary Test</Text>
      <Text style={styles.description}>
        Click the button below to test the error boundary
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShouldThrow(true)}
      >
        <Text style={styles.buttonText}>Throw Test Error</Text>
      </TouchableOpacity>
      <Text style={styles.note}>
        Note: This will trigger the error boundary fallback UI
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff3cd',
    borderWidth: 2,
    borderColor: '#ffc107',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ffc107',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginBottom: 12,
  },
  buttonText: {
    color: '#856404',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 11,
    color: '#856404',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});