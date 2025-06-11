import { StyleSheet } from "react-native";
import { COLORS } from "@/styles/colors";

export const home_styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: COLORS.sec_color,
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
});
