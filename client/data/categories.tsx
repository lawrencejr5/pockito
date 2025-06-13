import React, { ReactElement } from "react";

import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

interface CategoriesType {
  id: number;
  category: string;
  icon: ReactElement;
}

export const categories: CategoriesType[] = [
  {
    id: 1,
    category: "food & drinks",
    icon: <Ionicons name="fast-food-outline" size={16} color="black" />,
  },
  {
    id: 2,
    category: "bills",
    icon: <FontAwesome5 name="money-bill-alt" size={16} color="black" />,
  },
  {
    id: 3,
    category: "borrow",
    icon: (
      <MaterialCommunityIcons
        name="hand-extended-outline"
        size={16}
        color="black"
      />
    ),
  },
  {
    id: 4,
    category: "subscription",
    icon: (
      <MaterialCommunityIcons
        name="calendar-refresh-outline"
        size={16}
        color="black"
      />
    ),
  },
  {
    id: 5,
    category: "groceries",
    icon: <AntDesign name="shoppingcart" size={16} color="black" />,
  },
  {
    id: 6,
    category: "transport",
    icon: <Ionicons name="car-outline" size={16} color="black" />,
  },
  {
    id: 7,
    category: "clothing",
    icon: <Ionicons name="shirt-outline" size={16} color="black" />,
  },
  {
    id: 8,
    category: "others",
    icon: <Entypo name="dots-three-horizontal" size={16} color="black" />,
  },
];
