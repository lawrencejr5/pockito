import LottieView from "lottie-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";

const ANIMATIONS = [
  require("@/assets/lottie/coin.json"),
  require("@/assets/lottie/dividends.json"),
  require("@/assets/lottie/money.json"),
  require("@/assets/lottie/piggy.json"),
];

const WEALTH_SAYINGS = [
  "“Do not save what is left after spending, but spend what is left after saving.”",
  "“Wealth is the ability to fully experience life.”",
  "“Beware of little expenses; a small leak will sink a great ship.”",
  "“A budget is telling your money where to go instead of wondering where it went.”",
  "“Compound interest is the eighth wonder of the world.”",
  "“It’s not how much money you make, but how much money you keep.”",
  "“Richness is not about having more, it’s about needing less and owning your time.”",
  "“Every dollar you save today buys a piece of your future freedom.”",
  "“Track every coin, and the millions will take care of themselves.”",
  "“Financial peace isn’t the acquisition of stuff — it’s learning to live on less than you make.”",
];

export function AppLoader({
  label = "Loading your finances...",
}: {
  label?: string;
}) {
  const colors = Colors[useColorScheme()];

  const [animationSource] = useState(
    () => ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)],
  );
  const [saying] = useState(
    () => WEALTH_SAYINGS[Math.floor(Math.random() * WEALTH_SAYINGS.length)],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={[styles.container, { backgroundColor: colors.sheet }]}
    >
      <View style={styles.inner}>
        <LottieView
          source={animationSource}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={[styles.saying, { color: colors.text }]}>{saying}</Text>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  inner: {
    alignItems: "center",
    gap: 16,
    maxWidth: 320,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  saying: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
