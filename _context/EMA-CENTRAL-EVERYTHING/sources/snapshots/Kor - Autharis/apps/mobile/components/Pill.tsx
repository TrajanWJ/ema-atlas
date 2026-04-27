import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../lib/theme';

export type PillTone = 'neutral' | 'accent' | 'pos' | 'neg' | 'warn';

export interface PillProps {
  readonly label: string;
  readonly tone?: PillTone;
}

const toneBg: Record<PillTone, string> = {
  neutral: theme.colors.bgSunken,
  accent: theme.colors.accentSoft,
  pos: '#E1F0D8',
  neg: '#F6D9D2',
  warn: '#F3E6C3',
};

const toneInk: Record<PillTone, string> = {
  neutral: theme.colors.ink2,
  accent: theme.colors.accent,
  pos: theme.colors.pos,
  neg: theme.colors.neg,
  warn: theme.colors.warn,
};

export function Pill({ label, tone = 'neutral' }: PillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: toneBg[tone] }]}>
      <Text style={[styles.label, { color: toneInk[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: theme.space[4],
    paddingVertical: theme.space[2],
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: theme.type.size.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
