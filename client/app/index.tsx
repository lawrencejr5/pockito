import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthContext, AuthContextType } from "@/context/AuthContext"; // adjust to your setup

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuthContext() as AuthContextType;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/home");
    } else {
      router.replace("/(auth)/signin");
    }
  }, [isAuthenticated]);

  return null;
}
