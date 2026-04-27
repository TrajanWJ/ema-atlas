import React from 'react';
import { Tabs } from 'expo-router';
import { theme } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.ink4,
        tabBarStyle: {
          backgroundColor: theme.colors.bgRaised,
          borderTopColor: theme.colors.line,
        },
        headerStyle: { backgroundColor: theme.colors.bg },
        headerTitleStyle: {
          color: theme.colors.ink,
          fontWeight: '600',
          fontSize: theme.type.size.lg,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Opportunities' }}
      />
      <Tabs.Screen
        name="timesheet"
        options={{ title: 'Timesheet' }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ title: 'Earnings' }}
      />
    </Tabs>
  );
}
