import { POPULAR_CURRENCIES } from '@/features/user/services/user-service';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { borderRadius } from '@/theme/border-radius';
import { shadows } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInLeft,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { FlagIcon } from './flag-icon';
import { ThemedText } from './themed-text';

interface CurrencyPickerProps {
  value: string;
  onSelect: (code: string) => void;
}

const POPULAR_LIST = ['USD', 'EUR', 'GBP', 'PKR', 'INR', 'JPY', 'CNY', 'CAD', 'AUD', 'AED'];

// M3 state layer: scale feedback for primary interactive element
const PRESSED_SCALE = 0.97;

export function CurrencyPicker({ value, onSelect }: CurrencyPickerProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'all'>('popular');
  const [searchFocused, setSearchFocused] = useState(false);

  // M3 state layer for trigger button
  const triggerScale = useSharedValue(1);
  const triggerAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: triggerScale.value }] }));

  // Sheet animation
  const sheetY = useSharedValue(800);
  const backdropOpacity = useSharedValue(0);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: sheetY.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const selectedCurrency = POPULAR_CURRENCIES.find((c) => c.code === value) || POPULAR_CURRENCIES[0];

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const currencies = activeTab === 'popular'
      ? POPULAR_CURRENCIES.filter((c) => POPULAR_LIST.includes(c.code))
      : POPULAR_CURRENCIES;
    if (!query) return currencies;
    return currencies.filter(
      (c) => c.code.toLowerCase().includes(query) || c.name.toLowerCase().includes(query),
    );
  }, [searchQuery, activeTab]);

  const handleTabChange = (tab: 'popular' | 'all') => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const openModal = () => {
    setIsVisible(true);
    sheetY.value = 800;
    backdropOpacity.value = 0;
    sheetY.value = withTiming(0, { duration: 340, easing: Easing.out(Easing.cubic) });
    backdropOpacity.value = withTiming(1, { duration: 300 });
  };

  const dismissModal = () => {
    setIsVisible(false);
    setSearchQuery('');
    setActiveTab('popular');
  };

  const closeModal = () => {
    Keyboard.dismiss();
    sheetY.value = withTiming(800, { duration: 280, easing: Easing.in(Easing.cubic) }, (done) => {
      if (done) runOnJS(dismissModal)();
    });
    backdropOpacity.value = withTiming(0, { duration: 260 });
  };

  return (
    <View className="w-full">
      {/* Trigger button */}
      <Animated.View style={triggerAnimStyle}>
        <Pressable
          onPress={openModal}
          onPressIn={() => { triggerScale.value = withTiming(PRESSED_SCALE, { duration: 80 }); }}
          onPressOut={() => { triggerScale.value = withTiming(1, { duration: 150 }); }}
          accessibilityRole="button"
          accessibilityLabel={`Selected currency: ${selectedCurrency.code}, ${selectedCurrency.name}`}
          className="w-full bg-backgroundAlt dark:bg-dark-backgroundAlt rounded-3xl px-5 py-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3">
            <FlagIcon code={selectedCurrency.flag} size={28} />
            <View>
              <ThemedText type="defaultSemiBold" className="leading-tight">
                {selectedCurrency.code} — {selectedCurrency.symbol}
              </ThemedText>
              {/* style color wins over ThemedText inline — textMuted correctly applied */}
              <ThemedText className="text-xs" style={{ color: colors.textMuted }}>
                {selectedCurrency.name}
              </ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-expand-outline" color={colors.textMuted} size={20} />
        </Pressable>
      </Animated.View>

      <Modal visible={isVisible} animationType="none" transparent onRequestClose={closeModal}>
        <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={closeModal} />
          <Animated.View
            style={[sheetStyle, { ...shadows.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: -4 }, elevation: 16, paddingBottom: insets.bottom + 24 }]}
            className="bg-surface dark:bg-dark-surface rounded-t-3xl px-6 pt-10 overflow-hidden max-h-[88%]"
          >
            {/* ${colors.primary} replaces hardcoded rgba hex */}
            <LinearGradient
              colors={[`${colors.primary}26`, `${colors.primary}0D`, 'transparent']}
              className="absolute top-0 left-0 right-0 h-[25%]"
            />

            {/* Drag handle — M3 spec: 32dp wide, 4dp tall */}
            <View className="w-12 h-1.5 bg-borderStrong dark:bg-dark-borderStrong rounded-full mx-auto mb-8" />

            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center gap-3">
                <Ionicons name="globe-outline" size={22} color={colors.primary} />
                {/* font-bold = typography.fontWeights.bold (was font-black, outside token) */}
                <ThemedText className="text-xl font-bold">Select Currency</ThemedText>
              </View>
              <Pressable
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel="Close currency picker"
                style={({ pressed }) => [{
                  backgroundColor: `${colors.error}12`,
                  borderRadius: borderRadius.lg,   // 12px token ✅
                  padding: spacing.sm,              // 8px token (was raw 8)
                }, pressed && { opacity: 0.7 }]}
              >
                <Ionicons name="close" color={colors.error} size={20} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View className="mb-5 relative">
              {/* M3: icon adopts primary on focus; top aligned to paddingVertical */}
              <View style={{ position: 'absolute', left: spacing.md, top: spacing.md, zIndex: 10 }}>
                <Ionicons
                  name="search-outline"
                  color={searchFocused ? colors.primary : colors.textMuted}
                  size={18}
                />
              </View>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search by name or code..."
                placeholderTextColor={colors.inputPlaceholder}
                accessibilityLabel="Search currencies"
                style={{
                  backgroundColor: colors.inputBg,
                  color: colors.inputText,
                  borderWidth: 1,
                  borderColor: searchFocused ? colors.inputBorderFocused : colors.inputBorder,
                  borderRadius: borderRadius.xl,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  paddingLeft: 46,
                  fontSize: typography.fontSizes.sm,
                  fontFamily: 'PlusJakartaSans_600SemiBold',
                }}
              />
            </View>

            {/* Tabs — M3 Segmented Button pattern */}
            <View
              className="flex-row p-1 rounded-2xl mb-5"
              style={{ backgroundColor: colors.backgroundAlt }}
            >
              {(['popular', 'all'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => handleTabChange(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === tab }}
                  className="flex-1 py-3 rounded-xl flex-row items-center justify-center gap-1.5"
                  style={({ pressed }) => [
                    activeTab === tab
                      // shadows.sm token; colors.black replaces hardcoded '#000'
                      ? { backgroundColor: colors.surface, ...shadows.sm, shadowColor: colors.black }
                      : undefined,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Ionicons
                    name={tab === 'popular' ? 'star-outline' : 'globe-outline'}
                    size={14}
                    color={activeTab === tab ? colors.primary : colors.textMuted}
                  />
                  {/* ThemedText replaces raw Text; font-bold = fontWeights.bold (was font-black) */}
                  <ThemedText
                    className="font-bold text-sm"
                    style={{ color: activeTab === tab ? colors.primary : colors.textMuted }}
                  >
                    {tab === 'popular' ? 'Popular' : 'All Countries'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {/* Results count */}
            <Animated.View
              key={activeTab}
              entering={FadeIn.duration(400).easing(Easing.bezier(0.25, 0.1, 0.25, 1))}
              exiting={FadeOut.duration(200)}
              className="mb-3"
            >
              {/* text-xs = typography.fontSizes.xs (12px); font-semibold within token scale */}
              <ThemedText
                className="text-xs font-semibold uppercase"
                style={{ color: colors.textMuted }}
              >
                {filteredCurrencies.length} {activeTab === 'popular' ? 'popular' : ''} currencies
              </ThemedText>
            </Animated.View>

            {/* Currency List */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCurrencies.length === 0 ? (
                <View className="py-20 items-center gap-3">
                  <View style={{
                    backgroundColor: colors.backgroundAlt,
                    width: 64, height: 64,
                    borderRadius: borderRadius['2xl'],   // 24px token (was 20, magic)
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="search-outline" color={colors.textMuted} size={28} />
                  </View>
                  <ThemedText className="text-sm font-bold" style={{ color: colors.textMuted }}>
                    No currencies found
                  </ThemedText>
                </View>
              ) : (
                filteredCurrencies.map((item, index) => {
                  const isSelected = item.code === value;
                  return (
                    <Animated.View
                      key={`${activeTab}-${item.code}`}
                      entering={FadeInLeft.delay(index * 20).duration(250).easing(Easing.out(Easing.cubic))}
                      exiting={FadeOut.duration(150)}
                    >
                      <Pressable
                        onPress={() => { onSelect(item.code); closeModal(); }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`${item.name}, ${item.code}, ${item.symbol}`}
                        className="flex-row items-center justify-between p-3.5 rounded-2xl mb-2"
                        style={({ pressed }) => [
                          isSelected
                            // borderWidth 1 replaces 1.5 (non-integer)
                            ? { backgroundColor: `${colors.primary}12`, borderWidth: 1, borderColor: `${colors.primary}30` }
                            : { backgroundColor: colors.backgroundAlt },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <View className="flex-row items-center gap-3">
                          <FlagIcon code={item.flag} size={22} />

                          <View>
                            <View className="flex-row items-center gap-2">
                              {/* font-bold = fontWeights.bold (was font-black, outside token) */}
                              <ThemedText className="text-sm font-bold">{item.code}</ThemedText>
                              <View style={{
                                backgroundColor: `${colors.primary}15`,
                                borderRadius: borderRadius.md,   // 8px token (was 6, magic)
                                paddingHorizontal: spacing.xs,   // 4px token (was 6, magic)
                                paddingVertical: 2,
                              }}>
                                {/* text-xs = typography.fontSizes.xs; font-semibold within token scale */}
                                <ThemedText
                                  className="text-xs font-semibold"
                                  style={{ color: colors.primary }}
                                >
                                  {item.symbol}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText className="text-xs" style={{ color: colors.textMuted }}>
                              {item.name}
                            </ThemedText>
                          </View>
                        </View>

                        {isSelected && (
                          <View style={{
                            backgroundColor: `${colors.primary}20`,
                            borderRadius: borderRadius.lg,   // 12px token (was 10, magic)
                            padding: spacing.xs,             // 4px token ✅
                          }}>
                            <Ionicons name="checkmark" color={colors.primary} size={16} />
                          </View>
                        )}
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
}
