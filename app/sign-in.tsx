import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { useConvex } from "convex/react";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useCloudSync } from "@/components/CloudSyncProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import {
  MoneyTrackingShowcase,
  ReportsInsightsShowcase,
  WealthBalanceSheetShowcase,
} from "@/components/OnboardingShowcases";
import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import type { CurrencyInfo } from "@/constants/currencies";
import { api } from "@/convex/_generated/api";

const TOTAL_ONBOARDING_STEPS = 7; // Steps 0..6, then Step 7 = Sign In
const CURRENCY_PAGE_SIZE = 25;

const WHY_POCKITO_OPTIONS = [
  {
    id: "Track daily income & expenses",
    label: "Track daily income & expenses",
    sub: "Log every transaction & receipt in seconds",
    icon: "swap-vertical-outline" as const,
  },
  {
    id: "Know my true Net Worth",
    label: "Know my true Net Worth",
    sub: "Combine cash, investments, property & debts",
    icon: "trending-up-outline" as const,
  },
  {
    id: "Build a personal Balance Sheet",
    label: "Build a personal Balance Sheet",
    sub: "Generate a clean statement of assets & equity",
    icon: "document-text-outline" as const,
  },
  {
    id: "Control impulse spending",
    label: "Control impulse spending",
    sub: "Spot peak spending days & category leaks",
    icon: "shield-checkmark-outline" as const,
  },
  {
    id: "Track loans & debts",
    label: "Track loans & debts",
    sub: "Stay on top of credit cards, loans & mortgages",
    icon: "card-outline" as const,
  },
  {
    id: "Save & invest consistently",
    label: "Save & invest consistently",
    sub: "Grow your savings rate month after month",
    icon: "sparkles-outline" as const,
  },
];

const REFERRAL_OPTIONS = [
  { id: "TikTok", label: "TikTok", icon: "logo-tiktok" as const },
  { id: "Instagram", label: "Instagram", icon: "logo-instagram" as const },
  {
    id: "LLMs",
    label: "LLMs (ChatGPT, Claude, etc.)",
    icon: "sparkles-outline" as const,
  },
  {
    id: "Google / Meta Ads",
    label: "Google / Meta Ads",
    icon: "megaphone-outline" as const,
  },
  {
    id: "App Store / Play Store",
    label: "App Store / Google Play",
    icon: "storefront-outline" as const,
  },
  {
    id: "Friend or Family",
    label: "Friend or Family",
    icon: "people-outline" as const,
  },
  { id: "Threads", label: "Threads", icon: "logo-threads" as const },
  { id: "YouTube", label: "YouTube", icon: "logo-youtube" as const },
  {
    id: "Other",
    label: "Other",
    icon: "ellipsis-horizontal-circle-outline" as const,
  },
];

type CurrencyListEntry =
  | { kind: "section"; id: string; title: string }
  | { kind: "currency"; id: string; item: CurrencyInfo };

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </Svg>
  );
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );

    let jsonStr: string;
    if (typeof atob === "function") {
      jsonStr = atob(padded);
    } else {
      const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      let buffer = "";
      const clean = padded.replace(/=+$/, "").replace(/[^A-Za-z0-9+/]/g, "");
      let bc = 0;
      let bs = 0;
      for (let idx = 0; idx < clean.length; idx++) {
        const p = chars.indexOf(clean.charAt(idx));
        if (p === -1) continue;
        bs = bc % 4 ? bs * 64 + p : p;
        if (bc++ % 4) {
          buffer += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
      }
      jsonStr = buffer;
    }
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch (e) {
    console.log("Error decoding JWT payload", e);
    return null;
  }
}

export default function SignInScreen() {
  const colors = Colors[useColorScheme()];
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const { isAuthenticated, isSyncing, setPendingOnboarding } = useCloudSync();
  const { currency, currencies, favorites, setCurrency, toggleFavorite } =
    useCurrency();

  const [step, setStep] = useState(0); // 0..7
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    "Track daily income & expenses",
    "Know my true Net Worth",
  ]);
  const [referralSource, setReferralSource] = useState<string>("");
  const [completedOnboardingFlow, setCompletedOnboardingFlow] = useState(false);

  // Currency step state
  const [currencySearch, setCurrencySearch] = useState("");
  const [visibleCurrencyCount, setVisibleCurrencyCount] =
    useState(CURRENCY_PAGE_SIZE);

  // Auth states
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingAppleCredential, setPendingAppleCredential] = useState<{
    credential: AppleAuthentication.AppleAuthenticationCredential;
    emailAddress: string;
  } | null>(null);

  // Gentle floating animation for the Welcome logo
  const floatY = useSharedValue(0);
  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [floatY]);

  const floatingLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isSyncing) {
      setGoogleLoading(false);
      setAppleLoading(false);
    }
  }, [isAuthenticated, isSyncing]);

  const goNext = () => {
    Haptics.selectionAsync().catch(() => {});
    if (step === 6) {
      setCompletedOnboardingFlow(true);
    }
    setStep((s) => Math.min(7, s + 1));
  };

  const goBack = () => {
    Haptics.selectionAsync().catch(() => {});
    setStep((s) => Math.max(0, s - 1));
  };

  const toggleGoal = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const stageOnboardingBeforeSignIn = () => {
    if (completedOnboardingFlow) {
      setPendingOnboarding({
        onboardingGoals: selectedGoals,
        referralSource: referralSource || undefined,
        currency: currency.code,
        favoriteCurrencies: favorites,
      });
    }
  };

  const submitAppleSignIn = async (
    credential: AppleAuthentication.AppleAuthenticationCredential,
    emailAddress: string,
    customFirstName?: string,
    customLastName?: string,
  ) => {
    if (!credential.identityToken) {
      throw new Error("No identity token returned from Apple.");
    }
    stageOnboardingBeforeSignIn();
    const givenName =
      customFirstName || credential.fullName?.givenName || undefined;
    const familyName =
      customLastName || credential.fullName?.familyName || undefined;

    const appleArgs: Record<string, string> = {
      identityToken: credential.identityToken,
      user: credential.user,
      email: emailAddress,
    };
    if (givenName) appleArgs.givenName = givenName;
    if (familyName) appleArgs.familyName = familyName;

    const result = await signIn("apple", appleArgs);
    if (!result.signingIn) {
      throw new Error("Authentication failed. Please try again.");
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {},
    );
  };

  const completeAppleSignInWithName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(
        "Name required",
        "Please enter both your first and last name.",
      );
      return;
    }
    if (!pendingAppleCredential) return;

    setAppleLoading(true);
    setShowNameModal(false);
    try {
      await submitAppleSignIn(
        pendingAppleCredential.credential,
        pendingAppleCredential.emailAddress,
        firstName.trim(),
        lastName.trim(),
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : "Setup failed. Please try again.";
      Alert.alert("Apple Sign-In", msg);
      setAppleLoading(false);
    } finally {
      setPendingAppleCredential(null);
    }
  };

  const handleAppleLogin = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (Platform.OS !== "ios") {
      Alert.alert(
        "iOS Only",
        "Sign in with Apple is only available on Apple devices.",
      );
      return;
    }
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No identity token returned from Apple.");
      }

      let emailAddress = credential.email;
      if (!emailAddress) {
        const payload = decodeJwtPayload(credential.identityToken);
        if (payload && typeof payload.email === "string") {
          emailAddress = payload.email;
        }
      }

      if (!emailAddress) {
        throw new Error("Email address is required for authentication.");
      }

      const checkResult = await convex.query(api.users.check_apple_user, {
        apple_user_id: credential.user,
        email: emailAddress,
      });

      const isHiddenEmail =
        emailAddress.toLowerCase().endsWith("privaterelay.appleid.com") ||
        emailAddress.toLowerCase().includes("privately");

      if (!checkResult.exists && isHiddenEmail) {
        setPendingAppleCredential({ credential, emailAddress });
        setFirstName(credential.fullName?.givenName || "");
        setLastName(credential.fullName?.familyName || "");
        setShowNameModal(true);
        setAppleLoading(false);
        return;
      }

      await submitAppleSignIn(credential, emailAddress);
    } catch (error: unknown) {
      const errObj = error as { code?: string; message?: string };
      if (errObj?.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(
          "Apple Sign-In Failed",
          errObj?.message || "Apple Sign-in failed. Please try again.",
        );
      }
      setAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.selectionAsync().catch(() => {});
    setGoogleLoading(true);
    try {
      stageOnboardingBeforeSignIn();
      const redirectTo = makeRedirectUri({
        scheme: "pockito",
        path: "/sign-in",
      });

      const { redirect } = await signIn("google", { redirectTo });
      if (!redirect) {
        throw new Error("Authentication redirect URL not found.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
        {
          dismissButtonStyle: "close",
          showInRecents: false,
        },
      );

      if (result.type !== "success" || !result.url) {
        setGoogleLoading(false);
        return;
      }

      const code = new URL(result.url).searchParams.get("code");
      if (!code) {
        throw new Error("Authentication code not found in callback URL.");
      }

      const final = await signIn("google", { code });
      if (!final.signingIn) {
        throw new Error("Authentication failed. Please try again.");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch (error: unknown) {
      console.log("Google sign-in error:", error);
      setGoogleLoading(false);
      Alert.alert(
        "Google Sign-In Failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  // Currency step rows (sectioned into FAVORITES & ALL CURRENCIES with infinite scroll)
  const favSet = useMemo(() => new Set(favorites), [favorites]);

  const currencyRows = useMemo<CurrencyListEntry[]>(() => {
    const q = currencySearch.trim().toLowerCase();
    const filtered = q
      ? currencies.filter(
          (c) =>
            c.code.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q),
        )
      : currencies;

    const byDisplayThenCode = (a: CurrencyInfo, b: CurrencyInfo) => {
      if (a.code === currency.code) return -1;
      if (b.code === currency.code) return 1;
      return a.code.localeCompare(b.code);
    };

    const favItems = filtered
      .filter((c) => favSet.has(c.code))
      .sort(byDisplayThenCode);
    const otherItems = filtered
      .filter((c) => !favSet.has(c.code))
      .sort(byDisplayThenCode);

    const out: CurrencyListEntry[] = [];
    if (favItems.length > 0) {
      out.push({ kind: "section", id: "sec-fav", title: "FAVORITES" });
      for (const item of favItems) {
        out.push({ kind: "currency", id: `fav-${item.code}`, item });
      }
    }
    if (otherItems.length > 0) {
      out.push({
        kind: "section",
        id: "sec-all",
        title: favItems.length > 0 ? "ALL CURRENCIES" : "CURRENCIES",
      });
      for (const item of otherItems) {
        out.push({ kind: "currency", id: `all-${item.code}`, item });
      }
    }
    return out;
  }, [currencies, currency.code, favSet, currencySearch]);

  const visibleCurrencyRows = useMemo(
    () => currencyRows.slice(0, visibleCurrencyCount),
    [currencyRows, visibleCurrencyCount],
  );

  const renderCurrencyItem = useCallback(
    ({ item: entry }: { item: CurrencyListEntry }) => {
      if (entry.kind === "section") {
        return (
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
            {entry.title}
          </Text>
        );
      }

      const c = entry.item;
      const isDisplay = c.code === currency.code;
      const isFav = favSet.has(c.code);

      return (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setCurrency(c.code);
          }}
          style={[
            styles.currencyRow,
            {
              backgroundColor: colors.card,
              borderColor: isDisplay ? colors.tint : colors.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.currencySymbolBox,
              { backgroundColor: colors.accentSoft },
            ]}
          >
            <Text
              style={[styles.currencySymbolText, { color: colors.tint }]}
              numberOfLines={1}
            >
              {c.symbol}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.currencyCode, { color: colors.text }]}>
              {c.code}
            </Text>
            <Text
              style={[styles.currencyName, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {c.name}
            </Text>
          </View>
          {isDisplay && (
            <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
          )}
          <Pressable
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.selectionAsync().catch(() => {});
              toggleFavorite(c.code);
            }}
            style={{ padding: 4 }}
          >
            <Ionicons
              name={isFav ? "star" : "star-outline"}
              size={21}
              color={isFav ? "#eab308" : colors.textMuted}
            />
          </Pressable>
        </Pressable>
      );
    },
    [colors, currency.code, favSet, setCurrency, toggleFavorite],
  );

  const busy = googleLoading || appleLoading || isSyncing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      {/* Top Skip Bar (Steps 1..6 only) */}
      {step >= 1 && step <= 6 && (
        <Animated.View entering={FadeIn.duration(220)} style={styles.topNav}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setStep(7);
            }}
            hitSlop={8}
          >
            <Text style={[styles.skipText, { color: colors.textMuted }]}>
              Skip
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* STEP 0: WELCOME */}
      {step === 0 && (
        <View style={styles.welcomeWrap}>
          <View />
          <Animated.View
            entering={FadeInDown.duration(360)}
            style={styles.welcomeCenter}
          >
            <Animated.View
              style={[
                styles.welcomeLogoCard,
                {
                  backgroundColor: colors.darkCard,
                  borderColor: colors.cardBorder,
                },
                floatingLogoStyle,
              ]}
            >
              <Image
                source={require("@/assets/images/logo-mark.png")}
                style={styles.welcomeLogoImg}
                resizeMode="contain"
              />
            </Animated.View>

            <View
              style={[styles.brandPill, { backgroundColor: colors.accentSoft }]}
            >
              <Ionicons name="sparkles" size={13} color={colors.tint} />
              <Text style={[styles.brandPillText, { color: colors.tint }]}>
                WELCOME TO POCKITO
              </Text>
            </View>

            <Text style={[styles.welcomeHeadline, { color: colors.text }]}>
              Track your money.{"\n"}Manage your wealth.
            </Text>

            <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>
              Daily income & expenses, live net worth, and your personal balance
              sheet — designed for clarity.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(120).duration(360)}
            style={styles.welcomeFooter}
          >
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.primaryBtnText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#1c1a17" />
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setCompletedOnboardingFlow(false);
                setStep(7);
              }}
              style={styles.signInLinkBtn}
            >
              <Text
                style={[styles.signInLinkText, { color: colors.textMuted }]}
              >
                Already have an account?{" "}
                <Text
                  style={{ color: colors.tint, fontFamily: fonts.semiBold }}
                >
                  Sign in
                </Text>
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* STEP 1: MONEY TRACKING SHOWCASE */}
      {step === 1 && (
        <View style={styles.stepWrap}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepScroll}
          >
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={styles.stepHeader}
            >
              <Text style={[styles.stepTag, { color: colors.tint }]}>
                CASHFLOW & TRANSACTIONS
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Know where every coin goes
              </Text>
              <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                Track both income and expenses with live cashflow curves, date
                filters, and photo receipts.
              </Text>
            </Animated.View>

            <MoneyTrackingShowcase />
          </ScrollView>
        </View>
      )}

      {/* STEP 2: WEALTH & BALANCE SHEET SHOWCASE */}
      {step === 2 && (
        <View style={styles.stepWrap}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepScroll}
          >
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={styles.stepHeader}
            >
              <Text style={[styles.stepTag, { color: colors.tint }]}>
                WEALTH & NET WORTH
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Your net worth & balance sheet
              </Text>
              <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                Combine your cash, investments, real estate, possessions, and
                liabilities into an instant balance sheet.
              </Text>
            </Animated.View>

            <WealthBalanceSheetShowcase />
          </ScrollView>
        </View>
      )}

      {/* STEP 3: REPORTS & INSIGHTS SHOWCASE */}
      {step === 3 && (
        <View style={styles.stepWrap}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepScroll}
          >
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={styles.stepHeader}
            >
              <Text style={[styles.stepTag, { color: colors.tint }]}>
                REPORTS & ANALYTICS
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Clarity on your spending habits
              </Text>
              <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                Spot your biggest expense categories, daily & monthly averages,
                peak days, and savings rate.
              </Text>
            </Animated.View>

            <ReportsInsightsShowcase />
          </ScrollView>
        </View>
      )}

      {/* STEP 4: WHY DO YOU NEED POCKITO? */}
      {step === 4 && (
        <View style={styles.stepWrap}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepScroll}
          >
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={styles.stepHeader}
            >
              <Text style={[styles.stepTag, { color: colors.tint }]}>
                YOUR GOALS
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Why do you need Pockito?
              </Text>
              <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                Select all that apply so we can tailor your experience.
              </Text>
            </Animated.View>

            <View style={styles.optionsList}>
              {WHY_POCKITO_OPTIONS.map((opt, idx) => {
                const active = selectedGoals.includes(opt.id);
                return (
                  <Animated.View
                    key={opt.id}
                    entering={FadeInDown.delay(idx * 45).duration(260)}
                  >
                    <Pressable
                      onPress={() => toggleGoal(opt.id)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: active ? colors.tint : colors.cardBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          {
                            backgroundColor: active
                              ? colors.accent
                              : colors.accentSoft,
                          },
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? "#1c1a17" : colors.tint}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.optionLabel, { color: colors.text }]}
                        >
                          {opt.label}
                        </Text>
                        <Text
                          style={[
                            styles.optionSub,
                            { color: colors.textMuted },
                          ]}
                        >
                          {opt.sub}
                        </Text>
                      </View>
                      <Ionicons
                        name={active ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={active ? colors.tint : colors.cardBorder}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* STEP 5: WHERE DID YOU HEAR ABOUT US? */}
      {step === 5 && (
        <View style={styles.stepWrap}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepScroll}
          >
            <Animated.View
              entering={FadeInDown.duration(280)}
              style={styles.stepHeader}
            >
              <Text style={[styles.stepTag, { color: colors.tint }]}>
                ONE QUICK QUESTION
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Where did you hear about us?
              </Text>
              <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                Helps us know how people discover Pockito.
              </Text>
            </Animated.View>

            <View style={styles.optionsList}>
              {REFERRAL_OPTIONS.map((opt, idx) => {
                const active = referralSource === opt.id;
                return (
                  <Animated.View
                    key={opt.id}
                    entering={FadeInDown.delay(idx * 40).duration(250)}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setReferralSource(opt.id);
                      }}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: active ? colors.tint : colors.cardBorder,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          {
                            backgroundColor: active
                              ? colors.accent
                              : colors.accentSoft,
                          },
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? "#1c1a17" : colors.tint}
                        />
                      </View>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: colors.text, flex: 1 },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Ionicons
                        name={active ? "radio-button-on" : "radio-button-off"}
                        size={21}
                        color={active ? colors.tint : colors.cardBorder}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* STEP 6: CURRENCY & FAVORITES SETUP */}
      {step === 6 && (
        <View style={styles.stepWrap}>
          <View style={styles.currencyHeaderWrap}>
            <Text style={[styles.stepTag, { color: colors.tint }]}>
              CURRENCIES
            </Text>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Choose your currencies
            </Text>
            <Text style={[styles.stepSub, { color: colors.textMuted }]}>
              Tap a row to set your display currency ({currency.symbol}{" "}
              {currency.code}). Tap ★ to pin favorites ({favorites.length}).
            </Text>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={currencySearch}
                onChangeText={(text) => {
                  setCurrencySearch(text);
                  setVisibleCurrencyCount(CURRENCY_PAGE_SIZE);
                }}
                placeholder="Search currency (e.g. USD, Naira, Euro)"
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {currencySearch.length > 0 && (
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    setCurrencySearch("");
                    setVisibleCurrencyCount(CURRENCY_PAGE_SIZE);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textMuted}
                  />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={visibleCurrencyRows}
            keyExtractor={(item) => item.id}
            renderItem={renderCurrencyItem}
            onEndReached={() =>
              setVisibleCurrencyCount((prev) =>
                prev < currencyRows.length ? prev + CURRENCY_PAGE_SIZE : prev,
              )
            }
            onEndReachedThreshold={0.4}
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.currencyListContent}
          />
        </View>
      )}

      {/* Shared Bottom Progress Dots + Back & Continue Bar (Steps 1..6) */}
      {step >= 1 && step <= 6 && (
        <View style={styles.bottomBar}>
          <View style={styles.progressDots}>
            {Array.from({ length: 6 }).map((_, i) => {
              const active = i + 1 === step;
              const done = i + 1 < step;
              return (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    {
                      width: active ? 22 : 7,
                      backgroundColor:
                        active || done ? colors.tint : colors.cardBorder,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.bottomActionRow}>
            <Pressable
              onPress={goBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>

            <Pressable
              onPress={goNext}
              disabled={
                (step === 4 && selectedGoals.length === 0) ||
                (step === 5 && !referralSource)
              }
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  flex: 1,
                  backgroundColor: colors.accent,
                  opacity:
                    (step === 4 && selectedGoals.length === 0) ||
                    (step === 5 && !referralSource)
                      ? 0.55
                      : pressed
                        ? 0.85
                        : 1,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {step === 6 ? "Continue to Sign In" : "Continue"}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#1c1a17" />
            </Pressable>
          </View>
        </View>
      )}

      {/* STEP 7: SIGN IN WITH APPLE / GOOGLE */}
      {step === 7 && (
        <View style={styles.welcomeWrap}>
          <View />
          <Animated.View
            entering={FadeInDown.duration(320)}
            style={styles.welcomeCenter}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Image
                source={require("@/assets/images/logo-mark.png")}
                style={{ width: 52, height: 52 }}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>
              Pockito
            </Text>
            <Text style={[styles.headline, { color: colors.text }]}>
              {completedOnboardingFlow
                ? "Save your setup &\nsync to the cloud."
                : "Welcome back to\nPockito."}
            </Text>
            <Text style={[styles.subheadline, { color: colors.textMuted }]}>
              Sign in to back up your transactions, receipts, assets,
              liabilities, and balance sheet across devices.
            </Text>

            <View style={styles.pillsRow}>
              <View
                style={[
                  styles.featurePill,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Ionicons name="cash-outline" size={13} color={colors.tint} />
                <Text style={[styles.featurePillText, { color: colors.tint }]}>
                  Display: {currency.symbol} {currency.code}
                </Text>
              </View>
              <View
                style={[
                  styles.featurePill,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <Ionicons name="star" size={12} color="#eab308" />
                <Text style={[styles.featurePillText, { color: colors.tint }]}>
                  {favorites.length} Favorites
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(80).duration(320)}
            style={styles.actionWrap}
          >
            {isSyncing ? (
              <View
                style={[
                  styles.syncBanner,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.tint} />
                <Text style={[styles.syncBannerText, { color: colors.text }]}>
                  Setting up your Pockito Cloud account...
                </Text>
              </View>
            ) : (
              <>
                {(Platform.OS === "ios" || appleAvailable) && (
                  <Pressable
                    disabled={busy}
                    onPress={handleAppleLogin}
                    style={({ pressed }) => [
                      styles.authBtn,
                      {
                        backgroundColor: colors.text,
                        opacity: busy ? 0.65 : pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    {appleLoading ? (
                      <ActivityIndicator size="small" color={colors.sheet} />
                    ) : (
                      <>
                        <Ionicons
                          name="logo-apple"
                          size={21}
                          color={colors.sheet}
                        />
                        <Text
                          style={[styles.authBtnText, { color: colors.sheet }]}
                        >
                          Continue with Apple
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}

                <Pressable
                  disabled={busy}
                  onPress={handleGoogleLogin}
                  style={({ pressed }) => [
                    styles.authBtn,
                    {
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      opacity: busy ? 0.65 : pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <GoogleLogo size={20} />
                      <Text
                        style={[styles.authBtnText, { color: colors.text }]}
                      >
                        Continue with Google
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}

            <Text style={[styles.footerNote, { color: colors.textMuted }]}>
              Your preferences and financial data are encrypted and synced with
              your private cloud account.
            </Text>

            <Pressable
              onPress={goBack}
              hitSlop={8}
              style={styles.signInBackBtn}
            >
              <Ionicons
                name="chevron-back"
                size={15}
                color={colors.textMuted}
              />
              <Text
                style={[styles.signInBackText, { color: colors.textMuted }]}
              >
                Back
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* First-Time Apple Private Relay Name Collection Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowNameModal(false);
          setPendingAppleCredential(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Almost there...
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Since you chose to hide your email with Apple, let us know how we
              should address you.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              FIRST NAME
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.sheet,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Alex"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
              LAST NAME
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.sheet,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Morgan"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />

            <Pressable
              onPress={completeAppleSignInWithName}
              style={[
                styles.modalConfirmBtn,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.modalConfirmText}>Complete Sign-In</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowNameModal(false);
                setPendingAppleCredential(null);
              }}
              style={styles.modalCancelBtn}
            >
              <Text
                style={[styles.modalCancelText, { color: colors.textMuted }]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  progressDot: { height: 7, borderRadius: 999 },
  skipText: { fontFamily: fonts.semiBold, fontSize: 13 },

  welcomeWrap: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  welcomeCenter: { alignItems: "center", gap: 14 },
  welcomeLogoCard: {
    width: 112,
    height: 112,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  welcomeLogoImg: { width: 62, height: 62 },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  brandPillText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.9 },
  welcomeHeadline: {
    fontFamily: fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
  },
  welcomeSub: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 315,
  },
  welcomeFooter: { gap: 12 },
  primaryBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: "#1c1a17",
  },
  signInLinkBtn: { paddingVertical: 8, alignItems: "center" },
  signInLinkText: { fontFamily: fonts.regular, fontSize: 14 },

  stepWrap: { flex: 1 },
  stepScroll: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 20,
    gap: 18,
  },
  stepHeader: { gap: 6 },
  stepTag: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.9 },
  stepTitle: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 },
  stepSub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  bottomBar: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    paddingTop: 10,
    gap: 14,
  },
  bottomActionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  signInBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
  },
  signInBackText: { fontFamily: fonts.medium, fontSize: 13 },

  optionsList: { gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: { fontFamily: fonts.semiBold, fontSize: 15 },
  optionSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  currencyHeaderWrap: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 6,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    paddingVertical: 2,
  },
  currencyListContent: { paddingHorizontal: 22, paddingBottom: 16, gap: 8 },
  sectionHeader: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 2,
    paddingLeft: 4,
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  currencySymbolBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  currencySymbolText: { fontFamily: fonts.bold, fontSize: 15 },
  currencyCode: { fontFamily: fonts.semiBold, fontSize: 15 },
  currencyName: { fontFamily: fonts.regular, fontSize: 12, marginTop: 1 },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: 0.4 },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    textAlign: "center",
  },
  subheadline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 310,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
  },
  featurePillText: { fontFamily: fonts.semiBold, fontSize: 12 },

  actionWrap: { gap: 12, paddingTop: 12 },
  authBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  authBtnText: { fontFamily: fonts.semiBold, fontSize: 16 },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  syncBannerText: { fontFamily: fonts.medium, fontSize: 14 },
  footerNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    paddingHorizontal: 12,
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 14, 12, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.medium,
    marginBottom: 14,
  },
  modalConfirmBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalConfirmText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: "#1c1a17",
  },
  modalCancelBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  modalCancelText: { fontFamily: fonts.semiBold, fontSize: 14 },
});
