import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { JobRequest } from '@autharis/sdk';
import { Card } from '../../components/Card';
import { Pill } from '../../components/Pill';
import { theme } from '../../lib/theme';

// Inline fixtures — shape matches `JobRequest` from @autharis/sdk so the screen
// renders without network or an installed workspace. Swap for
// `client.jobs.list()` once the mobile app is wired to a backend.
const FIXTURES: readonly JobRequest[] = [
  {
    id: 'job_001',
    title: 'Fractional CFO for Series B SaaS',
    category: 'Finance',
    client: 'Northwind Labs',
    description:
      'Lead financial planning through next raise. Board deck, model, and cash runway.',
    hoursPerWeek: 12,
    duration: '6 months',
    timezone: 'America/New_York',
    budget: [180, 240],
    skills: ['FP&A', 'Fundraising', 'SaaS metrics'],
    industry: 'SaaS',
    status: 'Shortlist ready',
    posted: '2 days ago',
    matches: 7,
  },
  {
    id: 'job_002',
    title: 'Principal Product Designer — Fintech onboarding',
    category: 'Design',
    client: 'Harbor & Co.',
    description:
      'Own the KYC + funding onboarding flow. Ship a shippable prototype in 4 weeks.',
    hoursPerWeek: 20,
    duration: '3 months',
    timezone: 'Europe/London',
    budget: [140, 200],
    skills: ['Product design', 'Fintech', 'Research'],
    industry: 'Fintech',
    status: 'Matched',
    posted: '5 days ago',
    matches: 12,
  },
  {
    id: 'job_003',
    title: 'Staff Data Engineer — DuckDB warehouse',
    category: 'Engineering',
    client: 'Meridian Health',
    description:
      'Stand up a dbt + DuckDB analytics warehouse. Ship staged + marted models.',
    hoursPerWeek: 25,
    duration: '4 months',
    timezone: 'America/Los_Angeles',
    budget: [150, 210],
    skills: ['dbt', 'DuckDB', 'Python'],
    industry: 'Health',
    status: 'Reviewing',
    posted: '1 day ago',
    matches: 3,
  },
  {
    id: 'job_004',
    title: 'Head of People (interim) — 120-person scaleup',
    category: 'People',
    client: 'Auroral',
    description:
      'Cover a 4-month parental leave. Perf cycle, comp bands, exec hiring.',
    hoursPerWeek: 30,
    duration: '4 months',
    timezone: 'America/Denver',
    budget: [160, 220],
    skills: ['People ops', 'Comp', 'Exec hiring'],
    industry: 'Consumer',
    status: 'Draft',
    posted: '6 hours ago',
    matches: 1,
  },
];

function statusTone(status: JobRequest['status']) {
  switch (status) {
    case 'Matched':
      return 'pos' as const;
    case 'Shortlist ready':
      return 'accent' as const;
    case 'Closed':
      return 'neutral' as const;
    case 'Reviewing':
      return 'warn' as const;
    default:
      return 'neutral' as const;
  }
}

function formatBudget(budget: readonly [number, number]) {
  return `$${budget[0]}–$${budget[1]}/hr`;
}

export default function OpportunitiesScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        data={FIXTURES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Opportunities</Text>
            <Text style={styles.sub}>
              {FIXTURES.length} open matches in your feed
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.category}>{item.category.toUpperCase()}</Text>
              <Pill label={item.status} tone={statusTone(item.status)} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.client}>
              {item.client} · {item.timezone}
            </Text>
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatBudget(item.budget)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{item.hoursPerWeek} hrs/wk</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.meta}>{item.duration}</Text>
            </View>
            <View style={styles.skillRow}>
              {item.skills.map((s) => (
                <Pill key={s} label={s} tone="neutral" />
              ))}
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.space[3],
  },
  category: {
    fontSize: theme.type.size.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: theme.colors.ink3,
  },
  title: {
    fontSize: theme.type.size.lg,
    fontWeight: '600',
    color: theme.colors.ink,
    marginBottom: theme.space[2],
  },
  client: {
    fontSize: theme.type.size.sm,
    color: theme.colors.ink3,
    marginBottom: theme.space[3],
  },
  desc: {
    fontSize: theme.type.size.base,
    color: theme.colors.ink2,
    lineHeight: 20,
    marginBottom: theme.space[4],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.space[4],
    flexWrap: 'wrap',
  },
  meta: {
    fontSize: theme.type.size.sm,
    color: theme.colors.ink2,
    fontWeight: '500',
  },
  metaDot: {
    marginHorizontal: theme.space[3],
    color: theme.colors.ink4,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space[2],
  },
});
