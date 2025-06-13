import { View, Text, TouchableWithoutFeedback, TextInput } from "react-native";
import React, { useState } from "react";

import { COLORS } from "@/styles/colors";

import { create_styles } from "@/styles/create.styles";

import Feather from "@expo/vector-icons/Feather";
import AntDesign from "@expo/vector-icons/AntDesign";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";

import { types } from "@/data/types";
import { categories } from "@/data/categories";

const Create = () => {
  return (
    <View style={create_styles.container}>
      <Text style={{ fontFamily: "Raleway-Bold", fontSize: 25 }}>Create</Text>
      {/* Header */}
      <Header />

      <View style={create_styles.form}>
        {/* Types bar */}
        <TypesBar />

        {/* Amount input */}
        <AmountInput />

        {/* Title input */}
        <TitleInput />

        {/* Categories */}
        <Categories />
      </View>
    </View>
  );
};

export default Create;

const Header: React.FC = () => {
  return (
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
  );
};

const TypesBar: React.FC = () => {
  const [isActive, setIsActive] = useState<string>("income");

  return (
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
                    isActive === type ? COLORS.main_color : COLORS.border_color,
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
  );
};

const AmountInput: React.FC = () => {
  return (
    <View style={create_styles.amount_inp_container}>
      <Text
        style={{
          color: "grey",
          fontSize: 45,
          fontFamily: "Poppins-Regular",
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
  );
};

const TitleInput: React.FC = () => {
  return (
    <View style={create_styles.title_container}>
      <SimpleLineIcons name="notebook" size={18} color="grey" />
      <TextInput placeholder="Transaction title" style={{ width: "90%" }} />
    </View>
  );
};

const Categories: React.FC = () => {
  const [isActive, setIsActive] = useState<string>("bills");

  return (
    <View style={{ marginTop: 30 }}>
      <View style={{ flexDirection: "row", gap: 7, alignItems: "center" }}>
        <Feather name="grid" size={18} color="black" style={{ bottom: -2 }} />
        <Text style={{ fontFamily: "Raleway-SemiBold", fontSize: 18 }}>
          Categories
        </Text>
      </View>
      <View style={create_styles.categ_container}>
        {categories.map((cat, i) => {
          return (
            <TouchableWithoutFeedback
              key={cat.id}
              onPress={() => setIsActive(cat.category)}
            >
              <View
                style={[
                  create_styles.categ,
                  {
                    backgroundColor:
                      isActive === cat.category
                        ? COLORS.main_color
                        : COLORS.sec_color,
                  },
                ]}
              >
                {isActive === cat.category ? cat.icon_active : cat.icon}
                <Text
                  style={{
                    color: isActive === cat.category ? COLORS.sec_color : "",
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
  );
};
