import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

import { Ionicons } from '@expo/vector-icons';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvex } from 'convex/react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useCloudSync } from '@/components/CloudSyncProvider';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { fonts } from '@/constants/Colors';
import { api } from '@/convex/_generated/api';

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
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    let jsonStr: string;
    if (typeof atob === 'function') {
      jsonStr = atob(padded);
    } else {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let buffer = '';
      const clean = padded.replace(/=+$/, '').replace(/[^A-Za-z0-9+/]/g, '');
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
    console.log('Error decoding JWT payload', e);
    return null;
  }
}

export default function SignInScreen() {
  const colors = Colors[useColorScheme()];
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const { isAuthenticated, isSyncing } = useCloudSync();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pendingAppleCredential, setPendingAppleCredential] = useState<{
    credential: AppleAuthentication.AppleAuthenticationCredential;
    emailAddress: string;
  } | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  // RootLayoutNav switches to (tabs) automatically once authenticated & synced
  useEffect(() => {
    if (isAuthenticated && !isSyncing) {
      setGoogleLoading(false);
      setAppleLoading(false);
    }
  }, [isAuthenticated, isSyncing]);

  const submitAppleSignIn = async (
    credential: AppleAuthentication.AppleAuthenticationCredential,
    emailAddress: string,
    customFirstName?: string,
    customLastName?: string,
  ) => {
    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple.');
    }
    const givenName = customFirstName || credential.fullName?.givenName || undefined;
    const familyName = customLastName || credential.fullName?.familyName || undefined;

    const appleArgs: Record<string, string> = {
      identityToken: credential.identityToken,
      user: credential.user,
      email: emailAddress,
    };
    if (givenName) appleArgs.givenName = givenName;
    if (familyName) appleArgs.familyName = familyName;

    const result = await signIn('apple', appleArgs);
    if (!result.signingIn) {
      throw new Error('Authentication failed. Please try again.');
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const completeAppleSignInWithName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Name required', 'Please enter both your first and last name.');
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
      const msg = error instanceof Error ? error.message : 'Setup failed. Please try again.';
      Alert.alert('Apple Sign-In', msg);
      setAppleLoading(false);
    } finally {
      setPendingAppleCredential(null);
    }
  };

  const handleAppleLogin = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (Platform.OS !== 'ios') {
      Alert.alert('iOS Only', 'Sign in with Apple is only available on Apple devices.');
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
        throw new Error('No identity token returned from Apple.');
      }

      let emailAddress = credential.email;
      if (!emailAddress) {
        const payload = decodeJwtPayload(credential.identityToken);
        if (payload && typeof payload.email === 'string') {
          emailAddress = payload.email;
        }
      }

      if (!emailAddress) {
        throw new Error('Email address is required for authentication.');
      }

      const checkResult = await convex.query(api.users.check_apple_user, {
        apple_user_id: credential.user,
        email: emailAddress,
      });

      const isHiddenEmail =
        emailAddress.toLowerCase().endsWith('privaterelay.appleid.com') ||
        emailAddress.toLowerCase().includes('privately');

      if (!checkResult.exists && isHiddenEmail) {
        setPendingAppleCredential({ credential, emailAddress });
        setFirstName(credential.fullName?.givenName || '');
        setLastName(credential.fullName?.familyName || '');
        setShowNameModal(true);
        setAppleLoading(false);
        return;
      }

      await submitAppleSignIn(credential, emailAddress);
    } catch (error: unknown) {
      const errObj = error as { code?: string; message?: string };
      if (errObj?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(
          'Apple Sign-In Failed',
          errObj?.message || 'Apple Sign-in failed. Please try again.',
        );
      }
      setAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.selectionAsync().catch(() => {});
    setGoogleLoading(true);
    try {
      const redirectTo = makeRedirectUri({
        scheme: 'pockito',
        path: '/sign-in',
      });

      const { redirect } = await signIn('google', { redirectTo });
      if (!redirect) {
        throw new Error('Authentication redirect URL not found.');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        redirect.toString(),
        redirectTo,
        {
          dismissButtonStyle: 'close',
          showInRecents: false,
        },
      );

      if (result.type !== 'success' || !result.url) {
        setGoogleLoading(false);
        return;
      }

      const code = new URL(result.url).searchParams.get('code');
      if (!code) {
        throw new Error('Authentication code not found in callback URL.');
      }

      const final = await signIn('google', { code });
      if (!final.signingIn) {
        throw new Error('Authentication failed. Please try again.');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error: unknown) {
      console.log('Google sign-in error:', error);
      setGoogleLoading(false);
      Alert.alert(
        'Google Sign-In Failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const busy = googleLoading || appleLoading || isSyncing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.sheet }]}>
      <View style={styles.content}>
        <View style={styles.topBar} />

        {/* Logo & Hero Copy */}
        <Animated.View entering={FadeInDown.duration(320)} style={styles.heroWrap}>
          <View style={[styles.iconCircle, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.appIcon}
            />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Pockito</Text>
          <Text style={[styles.headline, { color: colors.text }]}>
            Sync your wealth{'\n'}across every device.
          </Text>
          <Text style={[styles.subheadline, { color: colors.textMuted }]}>
            Back up your transactions, receipts, assets, liabilities, and balance sheet securely to the cloud.
          </Text>

          <View style={styles.pillsRow}>
            {(['Cloud Backup', 'Receipts Storage', 'Live Net Worth'] as const).map((label) => (
              <View
                key={label}
                style={[styles.featurePill, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="checkmark-circle" size={13} color={colors.tint} />
                <Text style={[styles.featurePillText, { color: colors.tint }]}>{label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Auth Action Buttons */}
        <Animated.View entering={FadeInDown.delay(90).duration(320)} style={styles.actionWrap}>
          {isSyncing ? (
            <View style={[styles.syncBanner, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.syncBannerText, { color: colors.text }]}>
                Syncing your local data to Pockito Cloud...
              </Text>
            </View>
          ) : (
            <>
              {(Platform.OS === 'ios' || appleAvailable) && (
                <Pressable
                  disabled={busy}
                  onPress={handleAppleLogin}
                  style={({ pressed }) => [
                    styles.authBtn,
                    {
                      backgroundColor: colors.text,
                      opacity: busy ? 0.65 : pressed ? 0.85 : 1,
                    },
                  ]}>
                  {appleLoading ? (
                    <ActivityIndicator size="small" color={colors.sheet} />
                  ) : (
                    <>
                      <Ionicons name="logo-apple" size={21} color={colors.sheet} />
                      <Text style={[styles.authBtnText, { color: colors.sheet }]}>
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
                ]}>
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <GoogleLogo size={20} />
                    <Text style={[styles.authBtnText, { color: colors.text }]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}

          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            Your existing transactions and wealth items on this device will automatically sync when you sign in.
          </Text>
        </Animated.View>
      </View>

      {/* First-Time Apple Private Relay Name Collection Modal */}
      <Modal
        visible={showNameModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowNameModal(false);
          setPendingAppleCredential(null);
        }}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Almost there...</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
              Since you chose to hide your email with Apple, let us know how we should address you.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>FIRST NAME</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.sheet, borderColor: colors.cardBorder },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Alex"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>LAST NAME</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.sheet, borderColor: colors.cardBorder },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Morgan"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />

            <Pressable
              onPress={completeAppleSignInWithName}
              style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.modalConfirmText}>Complete Sign-In</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowNameModal(false);
                setPendingAppleCredential(null);
              }}
              style={styles.modalCancelBtn}>
              <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: {
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  appIcon: { width: 72, height: 72, borderRadius: 20 },
  appName: { fontFamily: fonts.bold, fontSize: 16, letterSpacing: 0.4 },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
  },
  subheadline: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  featurePillText: { fontFamily: fonts.semiBold, fontSize: 12 },

  actionWrap: { gap: 12, paddingTop: 12 },
  authBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  authBtnText: { fontFamily: fonts.semiBold, fontSize: 16 },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 14, 12, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 22, textAlign: 'center', marginBottom: 6 },
  modalSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fonts.medium,
    marginBottom: 14,
  },
  modalConfirmBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  modalConfirmText: { fontFamily: fonts.semiBold, fontSize: 15, color: '#1c1a17' },
  modalCancelBtn: { width: '100%', paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  modalCancelText: { fontFamily: fonts.semiBold, fontSize: 14 },
});

