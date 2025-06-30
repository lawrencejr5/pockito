import { View, Text } from "react-native";
import React, { useContext, createContext, ReactNode } from "react";

import axios from "axios";

export interface AuthContextType {}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <AuthContext.Provider value={""}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  return useContext(AuthContext);
};
