import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../lib/theme';

export interface CardProps extends ViewProps {
  readonly padded?: boolean;
}

export function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[styles.card, padded && styles.padded, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgRaised,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.lg,
    marginBottom: theme.space[4],
  },
  padded: {
    padding: theme.space[5],
  },
});
