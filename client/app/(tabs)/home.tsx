import { router } from "expo-router";
import { Image } from "expo-image";
import { Text, View, ScrollView, TouchableWithoutFeedback } from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { home_styles } from "@/styles/home.styles";

import { COLORS } from "@/styles/colors";
import Notification from "@/components/Notification";

import { AuthContextType, useAuthContext } from "@/context/AuthContext";

interface TransactionBoxProps {
  category: string;
  amount: number;
  title: string;
  date: string;
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
  const { getAccountSummary, getUserTransactions, transactions } =
    useTransactionContext() as TransactionContextType;

  useEffect(() => {
    getAccountSummary();
    getUserTransactions();
  }, []);

  return (
    <>
      <Notification notification={notification} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={home_styles.container}>
          {/* Logo */}
          <Logo />

          {/* Header */}
          <Header />

          {/* Balance card */}
          <BalanceCard />

          {/* Transactions */}
          <Transactions />
        </View>
      </ScrollView>
    </>
  );
}

// Logo component
export const Logo: React.FC = () => {
  return <Text style={home_styles.logo}>POCKITO</Text>;
};

// Header component
const Header: React.FC = () => {
  const { logout, signedIn } = useAuthContext() as AuthContextType;

  return (
    <View style={home_styles.header}>
      <View style={home_styles.header_left}>
        <TouchableWithoutFeedback
          onPress={() => router.push("/(tabs)/account")}
        >
          <Image
            source={require("@/assets/images/undraw_pic-profile_nr49.png")}
            style={{
              height: 60,
              width: 60,
              borderRadius: 30,
            }}
          />
        </TouchableWithoutFeedback>
        <View>
          <Text
            style={{
              color: "grey",
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
            }}
          >
            {signedIn.username}
          </Text>
        </View>
      </View>
      <View style={home_styles.header_right}>
        <TouchableWithoutFeedback onPress={() => router.push("/(tabs)/create")}>
          <View style={home_styles.add_btn}>
            <Text
              style={{
                color: COLORS.sec_color,
                fontFamily: "Raleway-SemiBold",
                fontSize: 14,
              }}
            >
              Add
            </Text>
            <Entypo
              name="plus"
              size={16}
              color={COLORS.sec_color}
              style={{
                color: COLORS.sec_color,
                fontFamily: "Raleway-Bold",
                fontSize: 14,
              }}
            />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={logout}>
          <MaterialIcons name="logout" size={25} color="black" />
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

// Balance card component
const BalanceCard: React.FC = () => {
  const { accountSummary, transactions } =
    useTransactionContext() as TransactionContextType;
  return (
    <View style={home_styles.balance_container_outer}>
      <View style={home_styles.balance_container}>
        <Text style={{ fontFamily: "Raleway-Bold", color: "grey" }}>
          Total balance:
        </Text>
        <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 30 }}>
          ${accountSummary?.balance?.toLocaleString()}
        </Text>
        <View style={home_styles.balance_details}>
          <View style={{ alignItems: "center", flexDirection: "column" }}>
            <Text style={home_styles.balance_type}>Income</Text>
            <Text style={[home_styles.balance_value, { color: "green" }]}>
              +${accountSummary?.income?.toLocaleString()}
            </Text>
          </View>
          <View style={{ alignItems: "center", flexDirection: "column" }}>
            <Text style={home_styles.balance_type}>Expenses</Text>
            <Text style={[home_styles.balance_value, { color: "red" }]}>
              -${accountSummary?.expense?.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const TransactionBox: React.FC<TransactionBoxProps> = ({
  category,
  amount,
  title,
  date,
}) => {
  const { showNotification } =
    useNotificationContext() as NotificationContextType;

  return (
    <View style={{ marginTop: 10 }}>
      <View style={home_styles.transaction_box}>
        <View style={home_styles.transaction_box_left}>
          <View
            style={[
              home_styles.icon_container,
              {
                backgroundColor:
                  category === "income" ? COLORS.green_light : COLORS.red_light,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                category === "income" ? "credit-card-plus" : "credit-card-minus"
              }
              size={20}
              color={category === "income" ? "green" : "red"}
            />
          </View>
          <View>
            <Text
              style={{
                fontFamily: "Raleway-SemiBold",
                textTransform: "capitalize",
                fontSize: 16,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontFamily: "Raleway-Regular",
                fontSize: 12,
                color: "grey",
                textTransform: "capitalize",
              }}
            >
              {category}
            </Text>
          </View>
        </View>
        <View style={home_styles.transaction_box_right}>
          <View style={home_styles.transaction_box_right_content}>
            {category === "income" ? (
              <Text style={{ color: "green", fontFamily: "Poppins-SemiBold" }}>
                +${amount}
              </Text>
            ) : (
              <Text style={{ color: "red", fontFamily: "Poppins-SemiBold" }}>
                -${amount}
              </Text>
            )}

            <Text
              style={{
                fontFamily: "Raleway-Regular",
                fontSize: 12,
                color: "grey",
              }}
            >
              {date}
            </Text>
          </View>
          <TouchableWithoutFeedback
            onPress={() => {
              showNotification("Transaction deleted", "error");
            }}
          >
            <MaterialIcons name="delete" size={30} color="red" />
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
};

const Transactions: React.FC = () => {
  return (
    <View style={{ paddingHorizontal: 15, marginTop: 30 }}>
      <Text style={{ fontFamily: "Raleway-Bold", fontSize: 18 }}>
        Recent Transactions
      </Text>

      <TransactionBox
        category="income"
        title="salary"
        amount={1500}
        date="May 15, 2025"
      />

      <TransactionBox
        category="expense"
        title="rent"
        amount={200}
        date="May 17, 2025"
      />

      <TransactionBox
        category="expense"
        title="food & drinks"
        amount={150}
        date="May 18, 2025"
      />

      <TransactionBox
        category="income"
        title="freelance app"
        amount={700}
        date="May 22, 2025"
      />
    </View>
  );
};
