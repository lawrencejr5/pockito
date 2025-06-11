import { Link, router } from "expo-router";
import { Image } from "expo-image";
import {
  Text,
  View,
  ScrollView,
  TouchableHighlight,
  TouchableWithoutFeedback,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Entypo from "@expo/vector-icons/Entypo";

import { home_styles } from "@/styles/home.styles";
import { COLORS } from "@/styles/colors";

export default function Home() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={home_styles.container}>
        <Text style={home_styles.logo}>POCKITO</Text>
        <View style={home_styles.header}>
          <View style={home_styles.headerLeft}>
            <Image
              source={require("@/assets/images/avatar2.png")}
              style={home_styles.avatar}
            />
            <View>
              <Text style={home_styles.welcomeText}>Welcome,</Text>
              <Text style={home_styles.usernameText}>Lawrencejr</Text>
            </View>
          </View>
          <View style={home_styles.headerRight}>
            <TouchableHighlight>
              <View style={home_styles.add_btn}>
                <Text style={home_styles.add_btnText}>Add</Text>
                <Entypo name="plus" style={home_styles.add_btnIcon} />
              </View>
            </TouchableHighlight>
            <TouchableWithoutFeedback
              onPress={() => router.push("/(auth)/signin")}
            >
              <MaterialIcons name="logout" size={25} color="black" />
            </TouchableWithoutFeedback>
          </View>
        </View>
        <View style={home_styles.balanceContainerOuter}>
          <View style={home_styles.balanceContainer}>
            <Text style={home_styles.balanceLabel}>Total balance:</Text>
            <Text style={home_styles.balanceValue}>$15,000</Text>
            <View style={home_styles.summaryContainer}>
              <View style={home_styles.summaryBox}>
                <Text style={home_styles.summaryLabel}>Income</Text>
                <Text style={home_styles.summaryValueIncome}>+$2,800</Text>
              </View>
              <View style={home_styles.summaryBox}>
                <Text style={home_styles.summaryLabel}>Expenses</Text>
                <Text style={home_styles.summaryValueExpenses}>-$900</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
