import { View, Text, TouchableWithoutFeedback, TextInput } from "react-native";
import React, { useState } from "react";

import { COLORS } from "@/styles/colors";

import { create_styles } from "@/styles/create.styles";

import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

type AntIconType = "caretup" | "caretdown";

const Create = () => {
  const [isActive, setIsActive] = useState<string>("income");

  const types: { type: string; color: string; icon: AntIconType }[] = [
    { type: "income", color: "green", icon: "caretup" },
    { type: "expense", color: "red", icon: "caretdown" },
  ];

  return (
    <View style={create_styles.container}>
      <Text style={{ fontFamily: "Raleway-Bold", fontSize: 25 }}>Create</Text>
      <View style={create_styles.header}>
        <Text style={{ fontFamily: "Raleway-SemiBold", fontSize: 16 }}>
          New Transaction
        </Text>
        <TouchableWithoutFeedback>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Text style={{ fontFamily: "Raleway-SemiBold", color: "green" }}>
              Save
            </Text>
            <Feather name="check-circle" size={14} color="green" />
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={create_styles.form}>
        <View style={create_styles.type_container}>
          {types.map(({ type, color, icon }) => {
            return (
              <TouchableWithoutFeedback
                key={type}
                onPress={() => setIsActive(type)}
              >
                <View
                  style={[
                    create_styles.type_btn,
                    {
                      borderColor:
                        isActive === type
                          ? COLORS.main_color
                          : COLORS.border_color,
                      backgroundColor:
                        isActive === type ? COLORS.main_color : "transparent",
                    },
                  ]}
                >
                  <AntDesign
                    name={icon}
                    size={14}
                    style={{
                      bottom: -2,
                      color: isActive === type ? COLORS.sec_color : color,
                    }}
                  />
                  <Text
                    style={{
                      fontFamily: "Raleway-Bold",
                      textTransform: "capitalize",
                      color: isActive === type ? COLORS.sec_color : "black",
                    }}
                  >
                    {type}
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 10,
            borderStyle: "solid",
            borderBottomWidth: 1,
            borderColor: COLORS.border_color,
          }}
        >
          <Text
            style={{
              color: "grey",
              fontSize: 50,
              fontFamily: "Poppins-SemiBold",
            }}
          >
            $
          </Text>
          <TextInput
            placeholder="0.00"
            style={{
              width: "90%",
              fontSize: 40,
              fontFamily: "Poppins-Regular",
            }}
          />
        </View>
        <View
          style={{
            marginTop: 20,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: COLORS.border_color,
            paddingHorizontal: 10,
            borderRadius: 7,
          }}
        >
          <SimpleLineIcons name="notebook" size={18} color="grey" />
          <TextInput placeholder="Transaction title" style={{ width: "90%" }} />
        </View>

        <View style={{ marginTop: 30 }}>
          <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
            <Feather
              name="grid"
              size={18}
              color="black"
              style={{ bottom: -2 }}
            />
            <Text style={{ fontFamily: "Raleway-SemiBold", fontSize: 18 }}>
              Categories
            </Text>
          </View>
          <View
            style={{
              marginTop: 20,
              gap: 10,
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-start",
            }}
          >
            <View style={create_styles.categ}>
              <Ionicons name="fast-food-outline" size={16} color="black" />
              <Text>Food & drinks</Text>
            </View>
            <View style={create_styles.categ}>
              <FontAwesome5 name="money-bill-alt" size={16} color="black" />
              <Text>Bills</Text>
            </View>
            <View style={create_styles.categ}>
              <MaterialCommunityIcons
                name="hand-extended-outline"
                size={16}
                color="black"
              />
              <Text>Borrow</Text>
            </View>
            <View style={create_styles.categ}>
              <MaterialCommunityIcons
                name="calendar-refresh-outline"
                size={16}
                color="black"
              />
              <Text>Subscription</Text>
            </View>
            <View style={create_styles.categ}>
              <AntDesign name="shoppingcart" size={16} color="black" />
              <Text>Groceries</Text>
            </View>
            <View style={create_styles.categ}>
              <Ionicons name="car-outline" size={16} color="black" />
              <Text>Transport</Text>
            </View>
            <View style={create_styles.categ}>
              <Ionicons name="shirt-outline" size={16} color="black" />{" "}
              <Text>Clothing</Text>
            </View>
            <View style={create_styles.categ}>
              <Entypo name="dots-three-horizontal" size={16} color="black" />{" "}
              <Text>Others</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Create;
