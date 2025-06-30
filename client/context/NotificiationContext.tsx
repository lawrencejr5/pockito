import React, {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
  Dispatch,
  SetStateAction,
  useRef,
} from "react";

import { Animated } from "react-native";

type StatusType = "error" | "success" | "";

export interface NotificationType {
  visible: boolean;
  message: string;
  status: StatusType;
}

export interface NotificationContextType {
  notification: NotificationType;
  setNotification: Dispatch<SetStateAction<NotificationType>>;

  notify: () => void;
  closeNotify: () => void;

  position: any;
  scale: any;

  showNotification: (message: string, status: StatusType) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationType>({
    visible: false,
    message: "",
    status: "",
  });

  useEffect(() => {
    if (notification.visible) {
      const notiTimeout = setTimeout(() => {
        setNotification({ visible: false, message: "", status: "" });
        closeNotify();
      }, 2000);
      return () => clearTimeout(notiTimeout);
    }
  }, [notification]);

  const position = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const notify = () => {
    if (notification.visible) {
      Animated.parallel([
        Animated.spring(scale, {
          friction: 7,
          tension: 40,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(position, {
          duration: 300,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const closeNotify = () => {
    Animated.parallel([
      Animated.spring(scale, {
        friction: 7,
        tension: 40,
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(position, {
        duration: 300,
        toValue: -100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showNotification = (message: string, status: StatusType): void => {
    setNotification({ visible: true, message, status });
    notify();
  };

  return (
    <NotificationContext.Provider
      value={{
        notification,
        setNotification,
        notify,
        closeNotify,
        position,
        scale,
        showNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  return useContext(NotificationContext);
};
