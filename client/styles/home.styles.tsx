import { StyleSheet } from "react-native";

export const home_styles = (COLORS: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 10,
      backgroundColor: COLORS.sec_color,
    },
    logo: {
      color: COLORS.main_color,
      fontFamily: "Raleway-ExtraBold",
      fontSize: 25,
      marginLeft: 10,
      marginBottom: 15,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 10,
    },
    header_left: {
      flexDirection: "row",
      justifyContent: "flex-start",
      alignItems: "center",
      gap: 15,
    },
    header_right: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 15,
    },
    add_btn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.main_color,
      paddingTop: 7,
      paddingRight: 15,
      paddingLeft: 17,
      paddingBottom: 8,
      borderRadius: 20,
      marginRight: 10,
    },

    balance_container_outer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 30,
      width: "100%",
    },
    balance_container: {
      width: "95%",
      borderRadius: 15,
      backgroundColor: COLORS.main_color,
      paddingVertical: 15,
      paddingHorizontal: 20,
    },
    balance_details: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 30,
      paddingVertical: 10,
      marginTop: 30,
      backgroundColor: COLORS.sec_color,
      borderRadius: 10,
    },
    balance_type: {
      fontFamily: "Raleway-Bold",
      color: COLORS.sec_color2,
      fontSize: 12,
    },
    balance_value: {
      fontFamily: "Poppins-Bold",
      fontSize: 14,
    },
    transaction_box: {
      backgroundColor: COLORS.sec_color3,
      elevation: 10,
      shadowColor: COLORS.border_color,
      borderRadius: 10,
      paddingVertical: 20,
      paddingHorizontal: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    transaction_box_left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    transaction_box_right: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    transaction_box_right_content: {
      alignItems: "flex-end",
      borderRightColor: COLORS.border_color,
      borderRightWidth: 1,
      borderStyle: "solid",
      paddingRight: 10,
    },
    icon_container: {
      width: 35,
      height: 35,
      borderRadius: 23,
      justifyContent: "center",
      alignItems: "center",
    },
  });
