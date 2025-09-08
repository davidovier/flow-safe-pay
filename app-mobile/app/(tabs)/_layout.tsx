import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: 5,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#000000',
        },
      }}
    >
      {/* Creator Navigation */}
      {user?.role === 'CREATOR' && (
        <>
          <Tabs.Screen
            name="deals"
            options={{
              title: 'Deals',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="briefcase" size={size} color={color} />
              ),
              headerTitle: 'My Deals',
            }}
          />
          <Tabs.Screen
            name="milestones"
            options={{
              title: 'Milestones',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="checkmark-circle" size={size} color={color} />
              ),
              headerTitle: 'Milestones',
            }}
          />
          <Tabs.Screen
            name="payouts"
            options={{
              title: 'Payouts',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="card" size={size} color={color} />
              ),
              headerTitle: 'Payouts',
            }}
          />
        </>
      )}

      {/* Brand Navigation */}
      {user?.role === 'BRAND' && (
        <>
          <Tabs.Screen
            name="campaigns"
            options={{
              title: 'Campaigns',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="megaphone" size={size} color={color} />
              ),
              headerTitle: 'My Campaigns',
            }}
          />
          <Tabs.Screen
            name="creators"
            options={{
              title: 'Creators',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people" size={size} color={color} />
              ),
              headerTitle: 'Find Creators',
            }}
          />
          <Tabs.Screen
            name="content"
            options={{
              title: 'Content',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="images" size={size} color={color} />
              ),
              headerTitle: 'Content Review',
            }}
          />
          <Tabs.Screen
            name="analytics"
            options={{
              title: 'Analytics',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="bar-chart" size={size} color={color} />
              ),
              headerTitle: 'Analytics',
            }}
          />
        </>
      )}

      {/* Agency Navigation */}
      {user?.role === 'AGENCY' && (
        <Tabs.Screen
          name="agency"
          options={{
            title: 'Agency',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business" size={size} color={color} />
            ),
            headerTitle: 'Agency Dashboard',
          }}
        />
      )}

      {/* Default/Fallback Navigation for other roles or missing role */}
      {(!user?.role || (user.role !== 'CREATOR' && user.role !== 'BRAND' && user.role !== 'AGENCY')) && (
        <>
          <Tabs.Screen
            name="deals"
            options={{
              title: 'Deals',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="briefcase" size={size} color={color} />
              ),
              headerTitle: 'Deals',
            }}
          />
          <Tabs.Screen
            name="projects"
            options={{
              title: 'Projects',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="folder" size={size} color={color} />
              ),
              headerTitle: 'Projects',
            }}
          />
        </>
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}