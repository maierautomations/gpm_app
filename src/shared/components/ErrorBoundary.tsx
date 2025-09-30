import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component catches JavaScript errors in child components
 * Logs errors and displays a fallback UI instead of crashing the entire app
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details to our logger (which will send to Sentry in production)
    logger.error('ErrorBoundary caught an error:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      stack: error.stack,
    });

    // Update state with error info for display
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.resetError);
      }

      // Default fallback UI
      return (
        <View style={styles.container}>
          <View style={styles.content}>
            {/* Error Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={64} color="#FF0000" />
            </View>

            {/* Error Title */}
            <Text style={styles.title}>Oops! Etwas ist schiefgelaufen</Text>

            {/* Error Description */}
            <Text style={styles.description}>
              Die App ist auf einen unerwarteten Fehler gestoßen. Keine Sorge, Ihre Daten sind
              sicher.
            </Text>

            {/* Error Details (only in development) */}
            {__DEV__ && error && (
              <ScrollView style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>Fehlerdetails (nur im Dev-Modus):</Text>
                <Text style={styles.errorText}>{error.toString()}</Text>
                {errorInfo && (
                  <Text style={styles.errorStack}>{errorInfo.componentStack}</Text>
                )}
              </ScrollView>
            )}

            {/* Action Buttons */}
            <TouchableOpacity style={styles.primaryButton} onPress={this.resetError}>
              <Ionicons name="refresh" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Erneut versuchen</Text>
            </TouchableOpacity>

            {/* Help Text */}
            <Text style={styles.helpText}>
              Falls das Problem weiterhin besteht, kontaktieren Sie uns bitte unter:
            </Text>
            <Text style={styles.contactText}>📞 +49 431 203615</Text>
          </View>
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetailsContainer: {
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF0000',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#FF0000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ErrorBoundary;