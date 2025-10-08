/**
 * Feature Flag Debug Panel
 *
 * Development-only component to test and debug feature flags.
 * Shows all flags, their values, and allows manual override testing.
 *
 * ⚠️ REMOVE THIS COMPONENT BEFORE PRODUCTION BUILD
 *
 * Usage:
 * ```typescript
 * // Temporarily add to any screen for testing
 * import FeatureFlagDebugPanel from '../../../shared/components/FeatureFlagDebugPanel';
 *
 * function MyScreen() {
 *   return (
 *     <>
 *       <FeatureFlagDebugPanel />
 *       {// ... rest of screen}
 *     </>
 *   );
 * }
 * ```
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAllFeatureFlags } from '../hooks/useFeatureFlag';
import FeatureFlagService from '../../services/featureFlagService';
import {
  FeatureFlag,
  FEATURE_FLAG_METADATA,
  getAllFeatureFlags,
} from '../../config/featureFlags';

export default function FeatureFlagDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const currentFlags = useAllFeatureFlags();

  if (!__DEV__) {
    return null; // Only show in development
  }

  const handleReload = async () => {
    await FeatureFlagService.reload();
    alert('Feature flags reloaded from PostHog');
  };

  const handleToggleFlag = (flag: FeatureFlag) => {
    setExpandedFlag(expandedFlag === flag ? null : flag);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable':
        return '#28a745';
      case 'beta':
        return '#ffc107';
      case 'experimental':
        return '#ff6b00';
      case 'deprecated':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <>
      {/* Floating Debug Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Ionicons name="settings-outline" size={24} color="white" />
      </TouchableOpacity>

      {/* Debug Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🚩 Feature Flags Debug</Text>
            <TouchableOpacity
              onPress={() => setIsVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {/* PostHog Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>PostHog Status:</Text>
              <Text
                style={[
                  styles.statusValue,
                  FeatureFlagService.isReady()
                    ? styles.statusSuccess
                    : styles.statusError,
                ]}
              >
                {FeatureFlagService.isReady() ? 'Connected' : 'Not Connected'}
              </Text>
            </View>
            <TouchableOpacity style={styles.reloadButton} onPress={handleReload}>
              <Ionicons name="refresh" size={18} color="white" />
              <Text style={styles.reloadButtonText}>Reload Flags</Text>
            </TouchableOpacity>
          </View>

          {/* Feature Flags List */}
          <ScrollView style={styles.flagsList}>
            {Object.values(FeatureFlag).map((flag) => {
              const isEnabled = currentFlags[flag];
              const metadata = FEATURE_FLAG_METADATA[flag];
              const isExpanded = expandedFlag === flag;

              return (
                <View key={flag} style={styles.flagCard}>
                  <TouchableOpacity
                    style={styles.flagHeader}
                    onPress={() => handleToggleFlag(flag)}
                  >
                    {/* Flag Name & Status */}
                    <View style={styles.flagInfo}>
                      <Text style={styles.flagName}>{metadata.name}</Text>
                      <View style={styles.flagMeta}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(metadata.status) },
                          ]}
                        >
                          <Text style={styles.statusBadgeText}>
                            {metadata.status}
                          </Text>
                        </View>
                        <Text style={styles.versionText}>{metadata.version}</Text>
                      </View>
                    </View>

                    {/* Toggle Switch */}
                    <View style={styles.toggleContainer}>
                      <View
                        style={[
                          styles.toggle,
                          isEnabled ? styles.toggleOn : styles.toggleOff,
                        ]}
                      >
                        <Text style={styles.toggleText}>
                          {isEnabled ? 'ON' : 'OFF'}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#666"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.flagDetails}>
                      <Text style={styles.detailLabel}>Description:</Text>
                      <Text style={styles.detailText}>{metadata.description}</Text>

                      <Text style={styles.detailLabel}>Flag Key:</Text>
                      <Text style={[styles.detailText, styles.codeText]}>
                        {flag}
                      </Text>

                      {metadata.dependencies && metadata.dependencies.length > 0 && (
                        <>
                          <Text style={styles.detailLabel}>Dependencies:</Text>
                          {metadata.dependencies.map((dep) => (
                            <Text key={dep} style={styles.dependencyText}>
                              • {FEATURE_FLAG_METADATA[dep].name}
                            </Text>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Instructions */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              💡 To override flags locally, edit{' '}
              <Text style={styles.codeText}>
                src/config/featureFlags.ts
              </Text>
            </Text>
          </View>

          {/* Warning */}
          <View style={styles.warning}>
            <Ionicons name="warning" size={16} color="#dc3545" />
            <Text style={styles.warningText}>
              Remove this component before production build
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusSuccess: {
    color: '#28a745',
  },
  statusError: {
    color: '#dc3545',
  },
  reloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  reloadButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  flagsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  flagCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  flagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  flagInfo: {
    flex: 1,
  },
  flagName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  flagMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  versionText: {
    fontSize: 11,
    color: '#999',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: '#28a745',
  },
  toggleOff: {
    backgroundColor: '#6c757d',
  },
  toggleText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  flagDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  dependencyText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    marginTop: 4,
  },
  footer: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#495057',
    textAlign: 'center',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8d7da',
    padding: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 6,
    gap: 6,
  },
  warningText: {
    fontSize: 11,
    color: '#721c24',
    fontWeight: '600',
  },
});
