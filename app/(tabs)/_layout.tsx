import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { theme } from '@/theme';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function getTabIconName(routeName: string, focused: boolean): TabIconName {
  switch (routeName) {
    case 'dashboard':
      return focused ? 'grid' : 'grid-outline';
    case 'documents':
      return focused ? 'document-text' : 'document-text-outline';
    case 'flashcards':
      return focused ? 'albums' : 'albums-outline';
    case 'quizzes':
      return focused ? 'help-circle' : 'help-circle-outline';
    case 'profile':
      return focused ? 'person-circle' : 'person-circle-outline';
    default:
      return focused ? 'ellipse' : 'ellipse-outline';
  }
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: theme.colors.textSoft,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 72,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            color={color}
            name={getTabIconName(route.name, focused)}
            size={size}
          />
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="documents" options={{ title: 'Documents' }} />
      <Tabs.Screen name="flashcards" options={{ title: 'Flashcards' }} />
      <Tabs.Screen name="quizzes" options={{ title: 'Quizzes' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
