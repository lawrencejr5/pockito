import { View, Text } from "react-native";
import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SettingsContextType {
  incognito: boolean;
  toggleIncognito: () => Promise<void>;
  theme: boolean;
  toggleTheme: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [incognito, setIncognito] = useState<boolean>(true);
  const [theme, setTheme] = useState<boolean>(true);

  useEffect(() => {
    const loadIncognito = async () => {
      try {
        const storedValue = await AsyncStorage.getItem("incognito");
        if (storedValue !== null) {
          setIncognito(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error("Failed to load incognito state:", error);
      }
    };

    loadIncognito();

    const loadTheme = async () => {
      try {
        const storedValue = await AsyncStorage.getItem("theme");
        if (storedValue !== null) {
          setTheme(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error("Failed to load theme state:", error);
      }
    };

    loadTheme();
  }, []);

  const toggleIncognito = async (): Promise<void> => {
    const newValue = !incognito;
    setIncognito(newValue);
    await AsyncStorage.setItem("incognito", JSON.stringify(newValue));
  };

  const toggleTheme = async (): Promise<void> => {
    const newValue = !theme;
    setTheme(newValue);
    await AsyncStorage.setItem("theme", JSON.stringify(newValue));
  };

  return (
    <SettingsContext.Provider
      value={{ incognito, toggleIncognito, theme, toggleTheme }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  return useContext(SettingsContext);
};

export default SettingsContext;
