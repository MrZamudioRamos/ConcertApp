import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#12121F', borderTopColor: '#222238' },
      tabBarActiveTintColor: '#00E5FF',
      tabBarInactiveTintColor: '#8888AA',
    }}>
      <Tabs.Screen name="index" options={{ title: 'Mis Conciertos',
        tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="buscar" options={{ title: 'Buscar',
        tabBarIcon: ({ color }) => <Ionicons name="search-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="widgets" options={{ title: 'Widgets',
        tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil',
        tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} /> }} />
    </Tabs>
  );
}
