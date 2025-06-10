import { Tabs } from "expo-router";
import SafeArea from "@/components/SafeArea";

export default function TabsLayout() {
  return (
    <SafeArea>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="create" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </SafeArea>
  );
}
