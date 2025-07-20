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
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [incognito, setIncognito] = useState<boolean>(true);

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
  }, []);

  const toggleIncognito = async (): Promise<void> => {
    const newValue = !incognito;
    setIncognito(newValue);
    await AsyncStorage.setItem("incognito", JSON.stringify(newValue));
  };

  return (
    <SettingsContext.Provider value={{ incognito, toggleIncognito }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  return useContext(SettingsContext);
};

export default SettingsContext;
