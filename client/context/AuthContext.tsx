import React, {
  useContext,
  createContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useRouter } from "expo-router";

import { jwtDecode } from "jwt-decode";

import {
  NotificationContextType,
  useNotificationContext,
} from "./NotificiationContext";

const AuthContext = createContext<AuthContextType | null>(null);

export interface UserType {
  userId?: string;
  username?: string;
  user?: string;
  email?: string;
  password?: string;
}

// Auth provider functions starts here....
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const { showNotification } =
    useNotificationContext() as NotificationContextType;

  const [signedIn, setSignedIn] = useState<UserType>({
    userId: "",
    username: "",
    email: "",
  });
  const [token, setToken] = useState<string>("");

  const [tokenLoading, setTokenLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for user token
    const checkTokenValidity = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setTokenLoading(false);
      if (storedToken) {
        try {
          const decoded: any = jwtDecode(storedToken);
          const now = Date.now() / 1000;
          if (decoded.exp && decoded.exp > now) {
            setToken(storedToken);
          } else {
            await AsyncStorage.removeItem("token"); // Expired
          }
        } catch (err) {
          console.log("Invalid token");
          await AsyncStorage.removeItem("token");
        }
      }
    };
    checkTokenValidity();

    getUserData();
  }, []);

  // Get signed in user data
  const getUserData = async (): Promise<void> => {
    try {
      const userId = await AsyncStorage.getItem("user");
      if (!userId) return;

      const { data } = await axios.get(
        `http://192.168.0.186:5000/api/v1/users/${userId}`
      );

      // Assuming data contains username, email, and _id
      setSignedIn({
        username: data.username,
        email: data.email,
        userId: data._id,
      });
    } catch (err) {
      console.log("Failed to fetch user data:", err);
    }
  };

  // Registering user
  const registerUser = async (
    username: string | undefined,
    email: string | undefined,
    password: string | undefined
  ): Promise<void> => {
    try {
      const { data } = await axios.post(
        "http://192.168.0.186:5000/api/v1/users/register",
        { username, email, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      showNotification(data?.msg, "success");
      // Store data
      await AsyncStorage.setItem("user", data?.userId);
      await AsyncStorage.setItem("token", data?.token);

      setToken(data?.token);
      await getUserData();
    } catch (err: any) {
      const errMsg = err.response.data.msg;
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  const loginUser = async (
    user: string | undefined,
    password: string | undefined
  ): Promise<void> => {
    try {
      const { data } = await axios.post(
        "http://192.168.0.186:5000/api/v1/users/login",
        { user, password }
      );
      showNotification(data?.msg, "success");

      // Store data
      await AsyncStorage.setItem("user", data?.userId);
      await AsyncStorage.setItem("token", data?.token);

      setToken(data?.token);
      await getUserData();
    } catch (err: any) {
      const errMsg = err.response.data.msg;
      showNotification(errMsg, "error");
      throw new Error(errMsg);
    }
  };

  const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    showNotification("User logged out", "error");

    setToken("");
    setSignedIn({
      userId: "",
      username: "",
      email: "",
    });

    router.push("/(auth)/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        tokenLoading,
        registerUser,
        loginUser,
        signedIn,
        token,
        isAuthenticated: !!token,
        logout,
      }}
    >
      {!tokenLoading ? children : <></>}
    </AuthContext.Provider>
  );
};

export interface AuthContextType {
  tokenLoading: boolean;

  registerUser: (
    username?: string,
    email?: string,
    password?: string
  ) => Promise<void>;

  loginUser: (user: string, password: string) => Promise<void>;

  signedIn: UserType;

  token: string;
  isAuthenticated: boolean;

  logout: () => Promise<void>;
}

export const useAuthContext = () => {
  return useContext(AuthContext);
};
