/**
 * Toast Component
 *
 * Displays temporary notification messages to users.
 * Used for showing errors, success messages, and information.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  visible: boolean;
  onHide?: () => void;
}

const { width } = Dimensions.get('window');

export default function Toast({
  message,
  type = 'info',
  duration = 3000,
  visible,
  onHide,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const iconName = getIconName(type);
  const colors = getColors(type);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: colors.background,
          borderLeftColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
        <Ionicons name={iconName} size={24} color={colors.icon} />
      </View>
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

function getIconName(type: ToastType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'close-circle';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'information-circle';
  }
}

function getColors(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        background: '#d4edda',
        border: '#28a745',
        iconBg: '#28a745',
        icon: '#fff',
        text: '#155724',
      };
    case 'error':
      return {
        background: '#f8d7da',
        border: '#dc3545',
        iconBg: '#dc3545',
        icon: '#fff',
        text: '#721c24',
      };
    case 'warning':
      return {
        background: '#fff3cd',
        border: '#ffc107',
        iconBg: '#ffc107',
        icon: '#fff',
        text: '#856404',
      };
    case 'info':
    default:
      return {
        background: '#d1ecf1',
        border: '#17a2b8',
        iconBg: '#17a2b8',
        icon: '#fff',
        text: '#0c5460',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    maxWidth: width - 32,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});