import { router } from "expo-router";
import { Image } from "expo-image";
import { Text, View, ScrollView, TouchableWithoutFeedback } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";

import { home_styles } from "@/styles/home.styles";

import Notification from "@/components/Notification";

import { AuthContextType, useAuthContext } from "@/context/AuthContext";
import {
  SettingsContextType,
  useSettingsContext,
} from "@/context/SettingsContext";

interface TransactionBoxProps {
  id: string | undefined;
  category: string;
  amount: string | null | undefined;
  title: string;
  date: string | undefined;
  type: string;
}

import {
  useNotificationContext,
  NotificationContextType,
} from "@/context/NotificiationContext";

import {
  useTransactionContext,
  TransactionContextType,
} from "@/context/TransactionContext";
import { useEffect } from "react";

export default function Home() {
  const { notification } = useNotificationContext() as NotificationContextType;
  const { getAccountSummary, getUserTransactions } =
    useTransactionContext() as TransactionContextType;

  const { signedIn } = useAuthContext() as AuthContextType;

  const { COLORS, incognito, toggleIncognito } =
    useSettingsContext() as SettingsContextType;

  const { accountSummary, transactions } =
    useTransactionContext() as TransactionContextType;

  const handleIncognito = async (): Promise<void> => {
    try {
      await toggleIncognito();
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getAccountSummary();
    getUserTransactions();
  }, []);

  const styles = home_styles(COLORS);

  return (
    <>
      <Notification notification={notification} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Logo */}
          <Text style={styles.logo}>POCKITO</Text>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.header_left}>
              <TouchableWithoutFeedback
                onPress={() => router.push("/(tabs)/account")}
              >
                <Image
                  source={require("@/assets/images/undraw_pic-profile_nr49.png")}
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 30,
                  }}
                />
              </TouchableWithoutFeedback>
              <View>
                <Text
                  style={{
                    color: COLORS.sec_color2,
                    fontFamily: "Raleway-SemiBold",
                    fontSize: 12,
                  }}
                >
                  Welcome,
                </Text>
                <Text
                  style={{
                    fontFamily: "Raleway-Bold",
                    textTransform: "capitalize",
                    width: "100%",
                    color: COLORS.sec_color2,
                  }}
                >
                  {signedIn.username}
                </Text>
              </View>
            </View>
            <View style={styles.header_right}>
              <TouchableWithoutFeedback
                onPress={() => router.push("/(tabs)/create")}
              >
                <View style={styles.add_btn}>
                  <Text
                    style={{
                      color: COLORS.white,
                      fontFamily: "Raleway-SemiBold",
                      fontSize: 14,
                    }}
                  >
                    Add
                  </Text>
                  <Entypo
                    name="plus"
                    size={16}
                    color={COLORS.white}
                    style={{
                      fontFamily: "Raleway-Bold",
                      fontSize: 14,
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
          {/* Balance card */}
          <View style={styles.balance_container_outer}>
            <View style={styles.balance_container}>
              <Text style={{ fontFamily: "Raleway-Bold", color: COLORS.white }}>
                Total balance:
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  width: "100%",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins-SemiBold",
                    fontSize: 30,
                    color: COLORS.white,
                  }}
                >
                  {incognito
                    ? "-----"
                    : `$${
                        accountSummary?.balance
                          ? accountSummary?.balance?.toLocaleString()
                          : "0.00"
                      }`}
                </Text>
                <TouchableWithoutFeedback onPress={handleIncognito}>
                  <View style={{ padding: 10 }}>
                    {incognito ? (
                      <Feather name="eye-off" size={30} color={COLORS.white} />
                    ) : (
                      <Feather name="eye" size={30} color={COLORS.white} />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
              <View style={styles.balance_details}>
                <View style={{ alignItems: "center", flexDirection: "column" }}>
                  <Text style={styles.balance_type}>Income</Text>
                  <Text style={[styles.balance_value, { color: COLORS.green }]}>
                    {incognito
                      ? "-----"
                      : ` +$${accountSummary?.income?.toLocaleString()}`}
                  </Text>
                </View>
                <View style={{ alignItems: "center", flexDirection: "column" }}>
                  <Text style={styles.balance_type}>Expenses</Text>
                  <Text style={[styles.balance_value, { color: COLORS.red }]}>
                    {incognito
                      ? "-----"
                      : ` -$${accountSummary?.expense?.toLocaleString()}`}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Transactions */}
          <View style={{ paddingHorizontal: 15, marginTop: 30 }}>
            <Text
              style={{
                fontFamily: "Raleway-Bold",
                fontSize: 18,
                color: COLORS.sec_color2,
              }}
            >
              Recent Transactions
            </Text>

            {transactions.length === 0 ? (
              <Empty />
            ) : (
              transactions.map((tx, i) => {
                return (
                  <TransactionBox
                    key={i}
                    id={tx._id}
                    category={tx.category}
                    type={tx.type}
                    title={tx?.title}
                    amount={tx?.amount?.toLocaleString()}
                    date={tx?.createdAt}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// Transaction Box component
const TransactionBox: React.FC<TransactionBoxProps> = ({
  category,
  amount,
  title,
  date,
  type,
  id,
}) => {
  const { incognito, COLORS } = useSettingsContext() as SettingsContextType;

  const styles = home_styles(COLORS);

  const { deleteTransaction } =
    useTransactionContext() as TransactionContextType;

  const handleDelete = async (id: string | undefined): Promise<void> => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      <View style={styles.transaction_box}>
        <View style={styles.transaction_box_left}>
          <View
            style={[
              styles.icon_container,
              {
                backgroundColor:
                  type === "credit" ? COLORS.green_light : COLORS.red_light,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                type === "credit" ? "credit-card-plus" : "credit-card-minus"
              }
              size={20}
              color={type === "credit" ? COLORS.green : COLORS.red}
            />
          </View>
          <View>
            <Text
              style={{
                fontFamily: "Raleway-SemiBold",
                textTransform: "capitalize",
                fontSize: 14,
                flexWrap: "wrap",
                width: 120,
                color: COLORS.sec_color2,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: "Raleway-Regular",
                fontSize: 12,
                color: COLORS.grey,
                textTransform: "capitalize",
              }}
            >
              {category}
            </Text>
          </View>
        </View>
        <View style={styles.transaction_box_right}>
          <View style={styles.transaction_box_right_content}>
            {type === "credit" ? (
              <Text
                style={{ color: COLORS.green, fontFamily: "Poppins-SemiBold" }}
              >
                {incognito ? "-----" : ` +$${amount}`}
              </Text>
            ) : (
              <Text
                style={{ color: COLORS.red, fontFamily: "Poppins-SemiBold" }}
              >
                {incognito ? "-----" : ` -$${amount}`}
              </Text>
            )}

            <Text
              style={{
                fontFamily: "Raleway-Regular",
                fontSize: 12,
                color: COLORS.grey,
              }}
            >
              {date
                ? new Date(date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </Text>
          </View>
          <TouchableWithoutFeedback
            onPress={() => {
              handleDelete(id);
            }}
          >
            <MaterialIcons name="delete" size={30} color={COLORS.red} />
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
};

// Empty transactions component
const Empty: React.FC = () => {
  const { COLORS } = useSettingsContext() as SettingsContextType;

  return (
    <View
      style={{
        flex: 1,
        height: 250,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
      }}
    >
      {/* <Text style={{ fontFamily: "Raleway-Bold", fontSize: 14 }}>
        No Transactions yet...
      </Text> */}
      <Image
        source={require("@/assets/images/undraw_savings_uwjn.png")}
        style={{
          height: 150,
          width: "50%",
          marginVertical: 10,
        }}
      />
      <TouchableWithoutFeedback onPress={() => router.push("/(tabs)/create")}>
        <View
          style={{
            backgroundColor: COLORS.main_color,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 7,
          }}
        >
          <Text
            style={{
              color: COLORS.sec_color,
              fontFamily: "Raleway-Bold",
              fontSize: 14,
            }}
          >
            New transaction &rarr;
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
