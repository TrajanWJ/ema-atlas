import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Invoice } from '@autharis/sdk';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { theme } from '../../lib/theme';

// Inline fixtures — `Invoice` shape from @autharis/sdk.
const FIXTURES: readonly Invoice[] = [
  {
    id: 'inv_2026_014',
    engagement: 'Harbor & Co. — Product design',
    client: 'Harbor & Co.',
    period: 'Apr 7 – Apr 13',
    hours: 22,
    rate: 180,
    subtotal: 3960,
    fee: 396,
    total: 3564,
    status: 'Paid',
    date: '2026-04-15',
  },
  {
    id: 'inv_2026_013',
    engagement: 'Harbor & Co. — Product design',
    client: 'Harbor & Co.',
    period: 'Mar 31 – Apr 6',
    hours: 20,
    rate: 180,
    subtotal: 3600,
    fee: 360,
    total: 3240,
    status: 'Paid',
    date: '2026-04-08',
  },
  {
    id: 'inv_2026_012',
    engagement: 'Northwind Labs — Fractional CFO',
    client: 'Northwind Labs',
    period: 'Mar 24 – Mar 30',
    hours: 12,
    rate: 220,
    subtotal: 2640,
    fee: 264,
    total: 2376,
    status: 'Sent',
    date: '2026-04-01',
  },
  {
    id: 'inv_2026_011',
    engagement: 'Meridian Health — Warehouse build',
    client: 'Meridian Health',
    period: 'Mar 17 – Mar 23',
    hours: 26,
    rate: 190,
    subtotal: 4940,
    fee: 494,
    total: 4446,
    status: 'Overdue',
    date: '2026-03-25',
  },
];

function statusTone(s: Invoice['status']) {
  switch (s) {
    case 'Paid':
      return 'pos' as const;
    case 'Sent':
      return 'accent' as const;
    case 'Overdue':
      return 'neg' as const;
    case 'Void':
      return 'neutral' as const;
    default:
      return 'neutral' as const;
  }
}

function formatUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

export default function EarningsScreen() {
  const ytd = FIXTURES
    .filter((i) => i.status === 'Paid')
    .reduce((s, i) => s + i.total, 0);
  const pending = FIXTURES
    .filter((i) => i.status === 'Sent' || i.status === 'Overdue')
    .reduce((s, i) => s + i.total, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        data={FIXTURES}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.heading}>Earnings</Text>
              <Text style={styles.sub}>Year-to-date payouts, net of platform fee</Text>
            </View>
            <Card>
              <Text style={styles.ytdLabel}>YTD paid</Text>
              <Text style={styles.ytdValue}>{formatUsd(ytd)}</Text>
              <View style={styles.ytdMeta}>
                <Text style={styles.ytdMetaText}>
                  {formatUsd(pending)} outstanding
                </Text>
                <Text style={styles.ytdDot}>·</Text>
                <Text style={styles.ytdMetaText}>{FIXTURES.length} invoices</Text>
              </View>
            </Card>
            <Text style={styles.sectionLabel}>Recent invoices</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.engagement} numberOfLines={1}>
                {item.engagement}
              </Text>
              <Pill label={item.status} tone={statusTone(item.status)} />
            </View>
            <Text style={styles.period}>{item.period}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.total}>{formatUsd(item.total)}</Text>
              <Text style={styles.breakdown}>
                {item.hours}h × ${item.rate} · fee {formatUsd(item.fee)}
              </Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  list: {
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
  ytdLabel: {
    fontSize: theme.type.size.xs,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: theme.colors.ink3,
  },
  ytdValue: {
    marginTop: theme.space[3],
    fontSize: theme.type.size['3xl'],
    fontWeight: '700',
    color: theme.colors.ink,
    letterSpacing: -0.5,
  },
  ytdMeta: {
    marginTop: theme.space[3],
    flexDirection: 'row',
    alignItems: 'center',
  },
  ytdMetaText: {
    fontSize: theme.type.size.sm,
    color: theme.colors.ink2,
    fontWeight: '500',
  },
  ytdDot: {
    marginHorizontal: theme.space[3],
    color: theme.colors.ink4,
  },
  sectionLabel: {
    fontSize: theme.type.size.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.colors.ink3,
    marginBottom: theme.space[3],
    marginTop: theme.space[2],
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space[2],
  },
  engagement: {
    flexShrink: 1,
    marginRight: theme.space[3],
    fontSize: theme.type.size.md,
    fontWeight: '600',
    color: theme.colors.ink,
  },
  period: {
    fontSize: theme.type.size.sm,
    color: theme.colors.ink3,
    marginBottom: theme.space[3],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  total: {
    fontSize: theme.type.size.xl,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  breakdown: {
    fontSize: theme.type.size.xs,
    color: theme.colors.ink3,
  },
});
