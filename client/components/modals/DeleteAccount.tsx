import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";

const { height } = Dimensions.get("window");

const DeleteAccount: React.FC<{
  visibility: boolean;
  onClose?: () => void;
}> = ({ visibility, onClose }) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visibility) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [visibility, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onClose) onClose();
    });
  };

  return (
    <Modal transparent visible={visibility} animationType="none">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[styles.modal, { transform: [{ translateY: slideAnim }] }]}
            >
              <Text style={styles.title}>Delete Account</Text>
              <Text style={styles.message}>
                Are you sure you want to delete your account? This action cannot
                be undone.
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginRight: 10,
                }}
              >
                <TouchableOpacity style={styles.delBtn} onPress={handleClose}>
                  <Text style={styles.delBtnText}>Yes, delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000020",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 200,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: "Raleway-Bold",
  },
  message: {
    fontSize: 15,
    color: "#444",
    marginBottom: 24,
    fontFamily: "Raleway-SemiBold",
  },
  closeBtn: {
    alignSelf: "flex-end",
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  closeBtnText: {
    color: "red",
    fontFamily: "Raleway-Bold",
  },
  delBtn: {
    alignSelf: "flex-end",
    padding: 10,
    backgroundColor: "red",
    borderRadius: 8,
  },
  delBtnText: {
    color: "#fff",
    fontFamily: "Raleway-Bold",
  },
});

export default DeleteAccount;
