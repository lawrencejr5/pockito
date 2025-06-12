import { Tabs } from "expo-router";
import SafeArea from "@/components/SafeArea";

import Feather from "@expo/vector-icons/Feather";

import { COLORS } from "@/styles/colors";

export default function TabsLayout() {
  return (
    <SafeArea>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.main_color,
          tabBarInactiveTintColor: COLORS.border_color,
          tabBarStyle: {
            elevation: 0,
            backgroundColor: COLORS.lighter_color,
          },
          tabBarLabelStyle: {
            fontFamily: "Raleway-Bold",
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color, size }) => (
              <Feather name="plus-circle" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Feather name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeArea>
  );
}
