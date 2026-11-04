import { AppButton, ThemedText } from '@/components/common';
import { Pressable } from '@/components/common/pressable';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useContentWidth } from '@/hooks/use-content-width';
import { View, useWindowDimensions, type LayoutChangeEvent, type ScrollView } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    BudgetIllustration,
    LedgerIllustration,
    ReportIllustration,
    SavingsIllustration,
} from './intro-illustrations';

type Slide = {
    key: string;
    kicker: string;
    title: string;
    body: string;
    Art: React.ComponentType<{ size: number; progress?: SharedValue<number> }>;
};

const SLIDES: Slide[] = [
    {
        key: 'track',
        kicker: 'Track',
        title: 'Every amount,\nwritten down.',
        body: 'Add income and spending in seconds. Move money between accounts without it counting as spending.',
        Art: LedgerIllustration,
    },
    {
        key: 'budget',
        kicker: 'Budget',
        title: 'Limits that\nspeak up.',
        body: 'Set a limit per category. Folio tells you when you are close — before the month runs out.',
        Art: BudgetIllustration,
    },
    {
        key: 'save',
        kicker: 'Save',
        title: 'Saving, with\na plan.',
        body: 'Put real money into goals from any account and see what it takes each month to get there.',
        Art: SavingsIllustration,
    },
    {
        key: 'report',
        kicker: 'Report',
        title: 'Your month,\nin print.',
        body: 'A plain-English summary, clear charts, and a PDF or Excel report whenever you need one.',
        Art: ReportIllustration,
    },
];

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1); // gentle "expo out" — editorial, not bouncy

/**
 * A text layer that slides `travel` × screen width as its page enters/leaves
 * and fades with it. Different travel per layer gives the parallax depth.
 * The first page also rises in on launch.
 */
function useParallaxLayer({ scrollX, index, width, entrance, reduceMotion, travel }: {
    scrollX: SharedValue<number>; index: number; width: number; entrance: SharedValue<number>; reduceMotion: boolean; travel: number;
}) {
    return useAnimatedStyle(() => {
        if (reduceMotion) return {};
        const range = [(index - 1) * width, index * width, (index + 1) * width];
        const x = interpolate(scrollX.value, range, [width * travel, 0, -width * travel], Extrapolation.CLAMP);
        const o = interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP);
        const e = index === 0 ? entrance.value : 1;
        return { opacity: o * e, transform: [{ translateX: x }, { translateY: (1 - e) * 18 }] };
    });
}

/**
 * One page. Every motion is driven by the shared scroll position, so the
 * layers move with the user's finger (parallax): the page number travels
 * furthest, the headline a little less, the body less again, and the
 * illustration drifts, scales and tilts slightly as it enters and leaves.
 */
function SlidePage({
    slide, index, total, scrollX, width, pageHeight, artSize, entrance, reduceMotion,
}: {
    slide: Slide; index: number; total: number; scrollX: SharedValue<number>; width: number;
    pageHeight: number; artSize: number; entrance: SharedValue<number>; reduceMotion: boolean;
}) {
    const colors = useThemeColors();
    const range = [(index - 1) * width, index * width, (index + 1) * width];

    // 0 → 1 as this page settles into view (both directions), × the first-launch entrance.
    const visible = useDerivedValue(() => {
        if (reduceMotion) return 1;
        const v = interpolate(scrollX.value, range, [0, 1, 0], Extrapolation.CLAMP);
        return index === 0 ? v * entrance.value : v;
    });

    const layerArgs = { scrollX, index, width, entrance, reduceMotion };
    const kickerStyle = useParallaxLayer({ ...layerArgs, travel: 0.45 });
    const titleStyle = useParallaxLayer({ ...layerArgs, travel: 0.3 });
    const bodyStyle = useParallaxLayer({ ...layerArgs, travel: 0.18 });

    const artStyle = useAnimatedStyle(() => {
        if (reduceMotion) return {};
        const x = interpolate(scrollX.value, range, [width * 0.55, 0, -width * 0.55], Extrapolation.CLAMP);
        const s = interpolate(scrollX.value, range, [0.86, 1, 0.86], Extrapolation.CLAMP);
        const r = interpolate(scrollX.value, range, [5, 0, -5], Extrapolation.CLAMP);
        const e = index === 0 ? entrance.value : 1;
        return {
            opacity: interpolate(scrollX.value, range, [0.2, 1, 0.2], Extrapolation.CLAMP) * e,
            transform: [{ translateX: x }, { scale: s * (0.94 + 0.06 * e) }, { rotate: `${r}deg` }],
        };
    });

    return (
        <View
            // Exact page size. No flex-1 here: in a horizontal list it overrides
            // the width and squeezes every page into a narrow column.
            style={{ width, height: pageHeight, paddingHorizontal: 20, paddingTop: 24 }}
            accessible
            accessibilityLabel={`Page ${index + 1} of ${total}. ${slide.title.replace('\n', ' ')} ${slide.body}`}
        >
            <Animated.View style={[{ flexDirection: 'row', alignItems: 'baseline' }, kickerStyle]}>
                <ThemedText type="figure" className="text-[13px]" style={{ color: colors.primary }}>
                    {String(index + 1).padStart(2, '0')}
                </ThemedText>
                <ThemedText type="kicker" className="ml-2">/ {String(total).padStart(2, '0')} · {slide.kicker}</ThemedText>
            </Animated.View>
            <Animated.View style={titleStyle}>
                <ThemedText type="display" className="mt-3 text-[38px] leading-[44px]">{slide.title}</ThemedText>
            </Animated.View>
            <Animated.View style={bodyStyle}>
                <ThemedText className="mt-4 text-[17px] leading-[26px]" style={{ color: colors.textSecondary }}>
                    {slide.body}
                </ThemedText>
            </Animated.View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Animated.View style={artStyle}>
                    <slide.Art size={artSize} progress={visible} />
                </Animated.View>
            </View>
        </View>
    );
}

/** A progress rule that fills continuously with the scroll position. */
function ProgressRule({ index, scrollX, width, onPress, label, selected }: {
    index: number; scrollX: SharedValue<number>; width: number; onPress: () => void; label: string; selected: boolean;
}) {
    const colors = useThemeColors();
    const fill = useAnimatedStyle(() => ({
        width: `${interpolate(scrollX.value / width, [index - 1, index], [0, 100], Extrapolation.CLAMP)}%`,
    }));
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            hitSlop={{ top: 14, bottom: 14 }}
            className="flex-1"
        >
            <View className="h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: colors.borderStrong }}>
                <Animated.View style={[{ height: '100%', backgroundColor: colors.primary, borderRadius: 2 }, fill]} />
            </View>
        </Pressable>
    );
}

/**
 * First-launch introduction: four editorial pages. Motion is scroll-linked
 * and runs on the UI thread; with Reduce Motion on, pages simply swap.
 */
export function IntroCarousel({ onDone }: { onDone: () => void }) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const width = useContentWidth();
    const reduceMotion = useReducedMotion();
    const listRef = useRef<ScrollView>(null);
    const [index, setIndex] = useState(0);
    const last = index === SLIDES.length - 1;
    // The pager's own measured size. Pages are given exactly this width and
    // height in pixels, and nothing is drawn until it is known — so a page can
    // never lay itself out narrower than the screen.
    const [pager, setPager] = useState({ w: 0, h: 0 });
    const onPagerLayout = useCallback((e: LayoutChangeEvent) => {
        const { width: w, height: h } = e.nativeEvent.layout;
        setPager(prev => (prev.w === Math.round(w) && prev.h === Math.round(h) ? prev : { w: Math.round(w), h: Math.round(h) }));
    }, []);
    const pageW = pager.w || width;
    const artSize = Math.min(pageW - 80, (pager.h || height * 0.6) * 0.5, 320);

    const scrollX = useSharedValue(0);
    const entrance = useSharedValue(reduceMotion ? 1 : 0);

    useEffect(() => {
        if (!reduceMotion) entrance.value = withDelay(120, withTiming(1, { duration: 900, easing: EASE_OUT }));
    }, [entrance, reduceMotion]);

    // Light tick each time a new page settles (kept out of the state updater,
    // which React may run twice).
    const indexRef = useRef(0);
    const settle = useCallback((i: number) => {
        if (indexRef.current !== i) {
            indexRef.current = i;
            Promise.resolve(Haptics.selectionAsync()).catch(() => {});
        }
        setIndex(i);
    }, []);

    const onScroll = useAnimatedScrollHandler({
        onScroll: e => { scrollX.value = e.contentOffset.x; },
        onMomentumEnd: e => { runOnJS(settle)(Math.round(e.contentOffset.x / pageW)); },
    });

    const goTo = (i: number) => {
        listRef.current?.scrollTo({ x: i * pageW, y: 0, animated: !reduceMotion });
        settle(i);
    };

    // Masthead + footer fade in with the first page.
    const chromeStyle = useAnimatedStyle(() => ({ opacity: entrance.value }));

    return (
        // Pinned to the screen width and clipped: otherwise the row of four
        // pages can widen this container and push everything off the right edge.
        <View
            className="bg-background dark:bg-dark-background"
            style={{ flex: 1, width, overflow: 'hidden', paddingTop: insets.top }}
        >
            <Animated.View style={chromeStyle}>
                <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
                    <View className="flex-row items-center">
                        <Image source={require('@/assets/images/brand-mark.png')} style={{ width: 32, height: 32 }} contentFit="contain" accessibilityIgnoresInvertColors />
                        <ThemedText style={{ fontFamily: 'PlayfairDisplay_700Bold_Italic', fontSize: 24, marginLeft: 10 }} accessibilityRole="header">
                            Folio
                        </ThemedText>
                    </View>
                    {!last && (
                        <Pressable
                            onPress={onDone}
                            accessibilityRole="button"
                            accessibilityLabel="Skip introduction"
                            className="min-h-[44px] px-3 justify-center rounded-full"
                            style={({ pressed }) => ({ backgroundColor: pressed ? colors.backgroundAlt : 'transparent' })}
                        >
                            <ThemedText type="label" style={{ color: colors.textSecondary }}>Skip</ThemedText>
                        </Pressable>
                    )}
                </View>
                <View className="h-[2px] mx-5 bg-textPrimary dark:bg-dark-textPrimary" />
            </Animated.View>

            <View testID="intro-pager" style={{ flex: 1 }} onLayout={onPagerLayout}>
                {pager.w > 0 && pager.h > 0 && (
                    <Animated.ScrollView
                        ref={listRef as never}
                        horizontal
                        pagingEnabled
                        bounces={false}
                        decelerationRate="fast"
                        showsHorizontalScrollIndicator={false}
                        onScroll={onScroll}
                        scrollEventThrottle={16}
                        style={{ width: pager.w, height: pager.h }}
                        contentContainerStyle={{ width: pager.w * SLIDES.length, height: pager.h }}
                    >
                        {SLIDES.map((item, i) => (
                            <SlidePage
                                key={item.key}
                                slide={item}
                                index={i}
                                total={SLIDES.length}
                                scrollX={scrollX}
                                width={pager.w}
                                pageHeight={pager.h}
                                artSize={artSize}
                                entrance={entrance}
                                reduceMotion={reduceMotion}
                            />
                        ))}
                    </Animated.ScrollView>
                )}
            </View>

            <Animated.View style={chromeStyle}>
                <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
                    <View className="flex-row gap-2 mb-5" accessibilityRole="tablist">
                        {SLIDES.map((s, i) => (
                            <ProgressRule
                                key={s.key}
                                index={i}
                                scrollX={scrollX}
                                width={pageW}
                                selected={i === index}
                                label={`Page ${i + 1}: ${s.kicker}`}
                                onPress={() => goTo(i)}
                            />
                        ))}
                    </View>
                    <AppButton
                        label={last ? 'Get started' : 'Next'}
                        icon={last ? undefined : 'arrow-forward'}
                        onPress={() => (last ? onDone() : goTo(index + 1))}
                    />
                    <ThemedText type="caption" className="text-center mt-3">
                        {last ? 'Private by design: your data never leaves this phone.' : ' '}
                    </ThemedText>
                </View>
            </Animated.View>
        </View>
    );
}
