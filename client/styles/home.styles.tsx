import { StyleSheet } from "react-native";
import { COLORS } from "@/styles/colors";

export const home_styles = StyleSheet.create({
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
  headerLeft: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 15,
  },
  avatar: {
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  welcomeText: {
    color: "grey",
    fontFamily: "Raleway-SemiBold",
    fontSize: 12,
  },
  usernameText: {
    fontFamily: "Raleway-Bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 15,
  },
  add_btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.main_color,
    paddingTop: 5,
    paddingRight: 10,
    paddingLeft: 12,
    paddingBottom: 8,
    borderRadius: 10,
  },
  add_btnText: {
    color: COLORS.sec_color,
    fontFamily: "Raleway-SemiBold",
    fontSize: 14,
  },
  add_btnIcon: {
    color: COLORS.sec_color,
    fontSize: 16,
  },
  balanceContainerOuter: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    width: "100%",
  },
  balanceContainer: {
    width: "95%",
    borderRadius: 15,
    backgroundColor: COLORS.sec_color,
    shadowColor: "#00000090",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  balanceLabel: {
    fontFamily: "Raleway-Bold",
    color: "grey",
  },
  balanceValue: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 40,
  },
  summaryContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  summaryBox: {
    alignItems: "center",
    flexDirection: "column",
  },
  summaryLabel: {
    fontFamily: "Raleway-Bold",
    color: "grey",
    fontSize: 13,
  },
  summaryValueIncome: {
    fontFamily: "Poppins-Bold",
    color: "green",
    fontSize: 16,
  },
  summaryValueExpenses: {
    fontFamily: "Poppins-Bold",
    color: "red",
    fontSize: 16,
  },
});
