import { Link, router } from "expo-router";
import { Image } from "expo-image";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { home_styles } from "@/styles/home.styles";

import { COLORS } from "@/styles/colors";

interface TransactionBoxProps {
  category: string;
  amount: number;
  title: string;
  date: string;
}

export default function Home() {
  return (
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
  );
}

// Logo component
export const Logo: React.FC = () => {
  return (
    <Text
      style={{
        color: COLORS.main_color,
        fontFamily: "Raleway-ExtraBold",
        fontSize: 25,
        marginLeft: 10,
        marginBottom: 15,
      }}
    >
      POCKITO
    </Text>
  );
};

// Header component
const Header: React.FC = () => {
  return (
    <View style={home_styles.header}>
      <View style={home_styles.headerLeft}>
        <Image
          source={require("@/assets/images/avatar2.png")}
          style={{ height: 40, width: 40, borderRadius: 20 }}
        />
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
          <Text style={{ fontFamily: "Raleway-Bold" }}>Lawrencejr</Text>
        </View>
      </View>
      <View style={home_styles.headerRight}>
        <TouchableHighlight>
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
        </TouchableHighlight>
        <TouchableWithoutFeedback onPress={() => router.push("/(auth)/signin")}>
          <MaterialIcons name="logout" size={25} color="black" />
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

// Balance card component
const BalanceCard: React.FC = () => {
  return (
    <View style={home_styles.balanceContainerOuter}>
      <View style={home_styles.balanceContainer}>
        <Text style={{ fontFamily: "Raleway-Bold", color: "grey" }}>
          Total balance:
        </Text>
        <Text style={{ fontFamily: "Poppins-SemiBold", fontSize: 30 }}>
          $15,000
        </Text>
        <View
          style={{
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 30,
          }}
        >
          <View style={{ alignItems: "center", flexDirection: "column" }}>
            <Text
              style={{
                fontFamily: "Raleway-Bold",
                color: "grey",
                fontSize: 12,
              }}
            >
              Income
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                color: "green",
                fontSize: 14,
              }}
            >
              +$2,000
            </Text>
          </View>
          <View style={{ alignItems: "center", flexDirection: "column" }}>
            <Text
              style={{
                fontFamily: "Raleway-Bold",
                color: "grey",
                fontSize: 12,
              }}
            >
              Expenses
            </Text>
            <Text
              style={{
                fontFamily: "Poppins-Bold",
                color: "red",
                fontSize: 14,
              }}
            >
              -$900
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
  return (
    <View style={{ marginTop: 10 }}>
      <View
        style={{
          backgroundColor: COLORS.lighter_color,
          elevation: 10,
          shadowColor: COLORS.border_color,
          borderRadius: 10,
          paddingVertical: 20,
          paddingHorizontal: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 35,
              height: 35,
              borderRadius: 23,
              backgroundColor:
                category === "income" ? COLORS.green_light : COLORS.red_light,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {category === "income" ? (
              <MaterialCommunityIcons
                name="credit-card-plus"
                size={20}
                color="green"
              />
            ) : (
              <MaterialCommunityIcons
                name="credit-card-minus"
                size={20}
                color="red"
              />
            )}
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              alignItems: "flex-end",
              borderRightColor: COLORS.border_color,
              borderRightWidth: 1,
              borderStyle: "solid",
              paddingRight: 10,
            }}
          >
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
          <View>
            <MaterialIcons name="delete" size={30} color="red" />
          </View>
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
