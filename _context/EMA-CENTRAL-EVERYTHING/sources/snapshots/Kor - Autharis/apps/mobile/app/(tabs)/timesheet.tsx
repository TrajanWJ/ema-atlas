import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TimesheetEntry } from '@autharis/sdk';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { theme } from '../../lib/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function currentWeekOf(): string {
  const now = new Date();
  const day = now.getUTCDay();
  // Monday = 1; shift so Sunday becomes last.
  const diff = (day + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

export default function TimesheetScreen() {
  const weekOf = useMemo(currentWeekOf, []);
  const [hours, setHours] = useState<Record<string, string>>(() =>
    Object.fromEntries(DAYS.map((d) => [d, ''])),
  );

  const parsed = useMemo<readonly TimesheetEntry[]>(
    () =>
      DAYS.map((d) => ({
        day: d,
        hours: Number(hours[d] ?? '') || 0,
        note: '',
      })),
    [hours],
  );

  const total = parsed.reduce((s, e) => s + e.hours, 0);

  function setDay(day: string, value: string) {
    // Only allow digits + one decimal.
    const clean = value.replace(/[^0-9.]/g, '');
    setHours((prev) => ({ ...prev, [day]: clean }));
  }

  function submit() {
    Alert.alert(
      'Timesheet submitted',
      `Week of ${weekOf} — ${total.toFixed(1)} hours queued for approval.`,
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.heading}>Timesheet</Text>
          <Text style={styles.sub}>Week of {weekOf}</Text>
        </View>

        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.engagement}>Harbor &amp; Co. — Product design</Text>
            <Pill label="Draft" tone="warn" />
          </View>
          <Text style={styles.rate}>$180/hr · engagement_eng_042</Text>
        </Card>

        <Card>
          {DAYS.map((day, idx) => (
            <View
              key={day}
              style={[
                styles.dayRow,
                idx < DAYS.length - 1 && styles.dayDivider,
              ]}
            >
              <Text style={styles.dayLabel}>{day}</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={hours[day]}
                onChangeText={(v) => setDay(day, v)}
                placeholder="0.0"
                placeholderTextColor={theme.colors.ink4}
                maxLength={4}
              />
              <Text style={styles.unit}>hrs</Text>
            </View>
          ))}
        </Card>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total this week</Text>
          <Text style={styles.totalValue}>{total.toFixed(1)} hrs</Text>
        </View>

        <Pressable
          onPress={submit}
          style={({ pressed }) => [
            styles.submit,
            pressed && styles.submitPressed,
          ]}
        >
          <Text style={styles.submitLabel}>Submit for approval</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: {
    padding: theme.space[5],
    paddingBottom: theme.space[10],
  },
  header: { marginBottom: theme.space[5] },
  heading: {
    fontSize: theme.type.size['2xl'],
    fontWeight: '700',
    color: theme.colors.ink,
  },
  sub: {
    marginTop: theme.space[2],
    fontSize: theme.type.size.sm,
    color: theme.colors.ink3,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagement: {
    fontSize: theme.type.size.md,
    fontWeight: '600',
    color: theme.colors.ink,
    flexShrink: 1,
    marginRight: theme.space[3],
  },
  rate: {
    marginTop: theme.space[2],
    fontSize: theme.type.size.sm,
    color: theme.colors.ink3,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space[4],
  },
  dayDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lineSoft,
  },
  dayLabel: {
    flex: 1,
    fontSize: theme.type.size.base,
    fontWeight: '500',
    color: theme.colors.ink,
  },
  input: {
    width: 72,
    paddingVertical: theme.space[3],
    paddingHorizontal: theme.space[4],
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    fontSize: theme.type.size.base,
    color: theme.colors.ink,
    textAlign: 'right',
    backgroundColor: theme.colors.bg,
  },
  unit: {
    width: 36,
    textAlign: 'right',
    color: theme.colors.ink3,
    fontSize: theme.type.size.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: theme.space[5],
    paddingHorizontal: theme.space[3],
  },
  totalLabel: {
    fontSize: theme.type.size.md,
    color: theme.colors.ink2,
  },
  totalValue: {
    fontSize: theme.type.size.xl,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  submit: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.space[5],
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  submitPressed: {
    opacity: 0.85,
  },
  submitLabel: {
    color: theme.colors.accentInk,
    fontWeight: '600',
    fontSize: theme.type.size.md,
    letterSpacing: 0.2,
  },
});
