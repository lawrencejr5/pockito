import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors, { fonts } from "@/constants/Colors";
import { LEGAL_URLS } from "@/constants/subscriptions";

export type LegalDocType = "terms" | "privacy" | null;

type Props = {
  doc: LegalDocType;
  onClose: () => void;
};

export function LegalModal({ doc, onClose }: Props) {
  const colors = Colors[useColorScheme()];
  const isTerms = doc === "terms";

  const openWebVersion = () => {
    const url = isTerms ? LEGAL_URLS.terms : LEGAL_URLS.privacy;
    WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  return (
    <Modal
      visible={doc !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isTerms ? "Terms of Use" : "Privacy Policy"}
          </Text>
          <View style={styles.headerActions}>
            <Pressable onPress={openWebVersion} hitSlop={8} style={styles.webBtn}>
              <Ionicons name="open-outline" size={18} color={colors.tint} />
            </Pressable>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: colors.card }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={[styles.updated, { color: colors.textMuted }]}>
            Pockito · Last updated November 2026
          </Text>

          {isTerms ? (
            <>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                By downloading or using Pockito, you agree to these Terms of Use.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                1. Subscriptions, 7-Day Trial & Lifetime Access
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                • Monthly Pro ($1.99/month): Eligible new subscribers receive a
                7-day free trial. Unless cancelled at least 24 hours before the
                end of the trial period, your Apple ID account will
                automatically be charged $1.99 per month (or local App Store
                equivalent) upon trial completion and on each monthly renewal.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                • Trial Reminder: If notifications are enabled, Pockito sends a
                reminder 2 days before your 7-day free trial ends.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                • Lifetime Pro ($34.99 one-time): A single non-consumable
                in-app purchase granting ongoing access to Pockito Pro with no
                recurring fees.
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                • Manage or Cancel: You can manage or cancel your subscription
                at any time in your Apple ID Account Settings or from Profile →
                Manage Subscription inside Pockito.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                2. Financial Information Disclaimer
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                Pockito is a personal budgeting, expense tracking, and net worth
                management tool. Nothing in the app constitutes financial,
                investment, tax, or legal advice.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                3. Account Deletion
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                Deleting your Pockito account permanently removes your cloud
                data, but does not automatically cancel an active App Store
                subscription. Cancel active subscriptions in your Apple ID
                settings before deleting your account.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.paragraph, { color: colors.text }]}>
                Pockito respects your privacy. This Privacy Policy describes how
                your information is collected, stored, and protected.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                1. Account & Financial Data
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                When you sign in with Apple or Google, we store your name,
                email address, and authentication identifier. The transactions,
                receipt photos, budgets, assets, and liabilities you enter are
                stored securely in your private cloud account solely to sync
                across your devices.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                2. Purchases & Subscriptions
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                All subscription and lifetime purchases are processed by Apple
                App Store and managed via RevenueCat. Pockito never receives or
                stores your credit card or payment credentials.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                3. Notifications & Reminders
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                When notifications are enabled, we store your Expo push token
                and timezone to deliver optional spending nudges, weekly wealth
                summaries, and a reminder 2 days before your free trial ends.
              </Text>

              <Text style={[styles.heading, { color: colors.tint }]}>
                4. Your Rights & Data Deletion
              </Text>
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                You may permanently delete your account and all stored
                transactions, receipts, budgets, and wealth records at any time
                via Profile → Delete Account.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  webBtn: {
    padding: 6,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  updated: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 15,
    marginTop: 8,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
});
