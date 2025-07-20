import {
  View,
  Text,
  TouchableWithoutFeedback,
  TextInput,
  GestureResponderEvent,
  ScrollView,
} from "react-native";
import React, { useState } from "react";

import { create_styles } from "@/styles/create.styles";

import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

import { types } from "@/data/types";
import { categories } from "@/data/categories";

import {
  useTransactionContext,
  TransactionContextType,
  TransactionType,
} from "@/context/TransactionContext";

import {
  useSettingsContext,
  SettingsContextType,
} from "@/context/SettingsContext";

import Notification from "@/components/Notification";
import {
  useNotificationContext,
  NotificationContextType,
} from "@/context/NotificiationContext";

const Create = () => {
  const { COLORS } = useSettingsContext() as SettingsContextType;

  const styles = create_styles(COLORS);

  const { createTransaction } =
    useTransactionContext() as TransactionContextType;

  const { notification, showNotification } =
    useNotificationContext() as NotificationContextType;

  const [typeActive, setTypeActive] = useState<"credit" | "debit">("credit");
  const [catActive, setCatActive] = useState<string>("income");

  const [amount, setAmount] = useState<string>("");
  const [title, setTitle] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const [numericValue, setNumericValue] = useState<number | null>(null);

  const formatWithCommas = (value: string): string => {
    const cleaned = value.replace(/,/g, ""); // remove existing commas
    if (cleaned === "") return "";
    const parts = cleaned.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const handleChange = (text: string) => {
    // Allow empty input
    if (text === "") {
      setAmount("");
      setNumericValue(null);
      return;
    }

    // Only allow numbers and optional decimal
    const raw = text.replace(/[^0-9.]/g, "");

    // Avoid multiple decimals
    if ((raw.match(/\./g) || []).length > 1) return;

    const formattedText = formatWithCommas(raw);
    setAmount(formattedText);

    const numeric = parseFloat(raw);
    setNumericValue(isNaN(numeric) ? null : numeric);
  };

  const handleSubmit = async (e: GestureResponderEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    if (!title || !amount) {
      showNotification("Input all required fields", "error");
      setLoading(false);
      return;
    }
    try {
      const txData: TransactionType = {
        title,
        amount: numericValue,
        category: catActive,
        type: typeActive,
      };

      await createTransaction(txData);
      setLoading(false);

      setAmount("");
      setTitle("");
      setCatActive("income");
      setTypeActive("credit");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Notification notification={notification} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Text
            style={{
              fontFamily: "Raleway-Bold",
              fontSize: 25,
              color: COLORS.sec_color2,
            }}
          >
            Create
          </Text>

          {/* Header */}
          <View style={styles.header}>
            <Text
              style={{
                fontFamily: "Raleway-SemiBold",
                fontSize: 16,
                color: COLORS.sec_color2,
              }}
            >
              New Transaction
            </Text>
            <TouchableWithoutFeedback onPress={handleSubmit}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Raleway-SemiBold",
                    color: COLORS.green,
                  }}
                >
                  Save
                </Text>
                {loading ? (
                  <Text>...</Text>
                ) : (
                  <Feather name="check-circle" size={14} color={COLORS.green} />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>

          <View style={styles.form}>
            {/* Types bar */}
            <View style={styles.type_container}>
              {types.map(({ type, color, icon }) => {
                return (
                  <TouchableWithoutFeedback
                    key={type}
                    onPress={() => setTypeActive(type)}
                  >
                    <View
                      style={[
                        styles.type_btn,
                        {
                          borderColor:
                            typeActive === type
                              ? COLORS.main_color
                              : COLORS.grey,
                          backgroundColor:
                            typeActive === type
                              ? COLORS.main_color
                              : "transparent",
                        },
                      ]}
                    >
                      <AntDesign
                        name={icon}
                        size={14}
                        style={{
                          bottom: -2,
                          color: typeActive === type ? COLORS.white : color,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: "Raleway-Bold",
                          textTransform: "capitalize",
                          color:
                            typeActive === type
                              ? COLORS.white
                              : COLORS.sec_color2,
                        }}
                      >
                        {type}
                      </Text>
                    </View>
                  </TouchableWithoutFeedback>
                );
              })}
            </View>

            {/* Amount input */}
            <View style={styles.amount_inp_container}>
              <Text
                style={{
                  color: COLORS.grey,
                  fontSize: 45,
                  fontFamily: "Poppins-Regular",
                }}
              >
                $
              </Text>
              <TextInput
                placeholder="0.00"
                placeholderTextColor={COLORS.grey}
                style={{
                  width: "90%",
                  fontSize: 40,
                  fontFamily: "Poppins-Regular",
                  color: COLORS.sec_color2,
                }}
                keyboardType="numeric"
                value={amount}
                onChangeText={handleChange}
              />
            </View>

            {/* Title input */}
            <View style={styles.title_container}>
              <SimpleLineIcons name="notebook" size={18} color={COLORS.grey} />
              <TextInput
                placeholder="Transaction title"
                placeholderTextColor={COLORS.grey}
                style={{ width: "90%", fontFamily: "Raleway-SemiBold" }}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Categories */}
            <View style={{ marginTop: 30 }}>
              <View
                style={{ flexDirection: "row", gap: 7, alignItems: "center" }}
              >
                <Feather
                  name="grid"
                  size={18}
                  color={COLORS.sec_color2}
                  style={{ bottom: -2 }}
                />
                <Text
                  style={{
                    fontFamily: "Raleway-SemiBold",
                    fontSize: 18,
                    color: COLORS.sec_color2,
                  }}
                >
                  Categories
                </Text>
              </View>
              <View style={styles.categ_container}>
                {categories.map((cat, i) => {
                  return (
                    <TouchableWithoutFeedback
                      key={cat.id}
                      onPress={() => setCatActive(cat.category)}
                    >
                      <View
                        style={[
                          styles.categ,
                          {
                            backgroundColor:
                              catActive === cat.category
                                ? COLORS.main_color
                                : COLORS.sec_color3,
                          },
                        ]}
                      >
                        {catActive === cat.category
                          ? cat.icon_active
                          : cat.icon}
                        <Text
                          style={{
                            color:
                              catActive === cat.category
                                ? COLORS.white
                                : COLORS.sec_color2,
                          }}
                        >
                          {cat.category}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default Create;
