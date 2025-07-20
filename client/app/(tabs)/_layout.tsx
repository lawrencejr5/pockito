import { Tabs } from "expo-router";
import SafeArea from "@/components/SafeArea";

import Feather from "@expo/vector-icons/Feather";

import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

export default function TabsLayout() {
  const { COLORS } = useSettingsContext() as SettingsContextType;

  return (
    <SafeArea>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.main_color,
          tabBarInactiveTintColor: COLORS.sec_color2,
          tabBarStyle: {
            elevation: 0,
            backgroundColor: COLORS.sec_color,
            borderTopWidth: 0, // removes the line/border on top
            paddingTop: 10, // adds top padding
            height: 70,
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
          name="account"
          options={{
            title: "Account",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeArea>
  );
}
