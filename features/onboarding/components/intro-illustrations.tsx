/**
 * Editorial illustrations for the intro carousel — drawn in the Folio palette
 * with plain SVG (no stock art): paper, ink rules, one teal, one ochre.
 *
 * Each takes an optional `progress` shared value (0 → 1, how "on screen" the
 * slide is). It drives the illustration's own motion — rows easing in, bars
 * filling, the ring sweeping round — on the UI thread, so it tracks the
 * user's finger exactly. Without it, everything renders in its final state.
 * Decorative only; the slide text carries the meaning.
 */
import { useThemeColors } from '@/hooks/use-theme-colors';
import tokens from '@/theme/tokens';
import React from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedProps, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

const OCHRE = '#B07D1E';
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

type Props = { size: number; progress?: SharedValue<number> };

function usePalette() {
    const c = useThemeColors();
    return {
        paper: c.surface,
        ink: c.textPrimary,
        muted: c.textMuted,
        rule: c.borderStrong,
        teal: c.primary,
        deep: c.scheme === 'dark' ? '#256A6E' : tokens.brand.primaryDark,
        income: c.income,
        expense: c.expense,
    };
}

/** 1 when there is no progress driver, so static renders show the finished art. */
function useProgress(progress?: SharedValue<number>) {
    return useDerivedValue(() => (progress ? progress.value : 1));
}

/** Staggered 0→1 for item `i` of `n` within the slide's progress. */
function stagger(p: number, i: number, n: number) {
    'worklet';
    const start = 0.25 + (i / n) * 0.5;
    return interpolate(p, [start, start + 0.3], [0, 1], Extrapolation.CLAMP);
}

const svgProps = { viewBox: '0 0 300 300', accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

// ── 01 Ledger: entries are written in one by one ─────────────────────────
function LedgerRow({ i, y, w, p, pal }: { i: number; y: number; w: number; p: SharedValue<number>; pal: ReturnType<typeof usePalette> }) {
    const rowProps = useAnimatedProps(() => ({ opacity: stagger(p.value, i, 5) }));
    const fillProps = useAnimatedProps(() => ({ width: 90 * w * stagger(p.value, i, 5) }));
    return (
        <AnimatedG animatedProps={rowProps}>
            <Circle cx={72} cy={y} r={6} fill="none" stroke={pal.rule} strokeWidth={2} />
            <AnimatedRect x={86} y={y - 4} height={8} rx={2} fill={pal.muted} opacity={0.55} animatedProps={fillProps} />
            <Rect x={196} y={y - 4} width={40} height={8} rx={2} fill={i === 2 ? pal.income : pal.ink} />
            <Line x1={64} y1={y + 14} x2={236} y2={y + 14} stroke={pal.rule} strokeWidth={1} />
        </AnimatedG>
    );
}

export function LedgerIllustration({ size, progress }: Props) {
    const pal = usePalette();
    const p = useProgress(progress);
    const rows = [0.62, 0.4, 0.78, 0.5, 0.68];
    return (
        <Svg width={size} height={size} {...svgProps}>
            <Rect x={58} y={38} width={196} height={240} rx={10} fill={pal.rule} opacity={0.5} />
            <Path d="M40 30 H222 L260 68 V262 a10 10 0 0 1 -10 10 H50 a10 10 0 0 1 -10 -10 V40 a10 10 0 0 1 10 -10 Z" fill={pal.paper} stroke={pal.rule} strokeWidth={2} />
            <Path d="M222 30 V68 H260 Z" fill={OCHRE} />
            <Rect x={64} y={58} width={88} height={10} rx={2} fill={pal.ink} />
            <Rect x={64} y={76} width={52} height={6} rx={2} fill={pal.muted} />
            <Line x1={64} y1={98} x2={236} y2={98} stroke={pal.ink} strokeWidth={2.5} />
            {rows.map((w, i) => <LedgerRow key={i} i={i} y={122 + i * 28} w={w} p={p} pal={pal} />)}
        </Svg>
    );
}

// ── 02 Budget: bars fill up to (and past) their alert tick ───────────────
function BudgetBar({ i, y, w, color, p, pal }: { i: number; y: number; w: number; color: string; p: SharedValue<number>; pal: ReturnType<typeof usePalette> }) {
    const full = 192;
    const fill = useAnimatedProps(() => ({ width: Math.min(w, 1) * full * stagger(p.value, i, 4) }));
    return (
        <G>
            <Rect x={54} y={y} width={60 + (i % 2) * 20} height={7} rx={2} fill={pal.muted} opacity={0.6} />
            <Rect x={54} y={y + 15} width={full} height={7} rx={3.5} fill={pal.rule} opacity={0.6} />
            <AnimatedRect x={54} y={y + 15} height={7} rx={3.5} fill={color} animatedProps={fill} />
            <Line x1={54 + full * 0.8} y1={y + 11} x2={54 + full * 0.8} y2={y + 26} stroke={pal.ink} strokeWidth={2} />
        </G>
    );
}

export function BudgetIllustration({ size, progress }: Props) {
    const pal = usePalette();
    const p = useProgress(progress);
    const bars = [
        { w: 0.46, color: pal.teal },
        { w: 0.84, color: OCHRE },
        { w: 1.04, color: pal.expense },
        { w: 0.3, color: pal.teal },
    ];
    return (
        <Svg width={size} height={size} {...svgProps}>
            <Rect x={30} y={40} width={240} height={220} rx={14} fill={pal.paper} stroke={pal.rule} strokeWidth={2} />
            <Rect x={54} y={64} width={96} height={10} rx={2} fill={pal.ink} />
            <Line x1={54} y1={88} x2={246} y2={88} stroke={pal.ink} strokeWidth={2} />
            {bars.map((b, i) => <BudgetBar key={i} i={i} y={112 + i * 36} w={b.w} color={b.color} p={p} pal={pal} />)}
        </Svg>
    );
}

// ── 03 Savings: the goal ring sweeps round as deposits step in ──────────
function Deposit({ i, p, pal }: { i: number; p: SharedValue<number>; pal: ReturnType<typeof usePalette> }) {
    const h = 18 + i * 10;
    const props = useAnimatedProps(() => {
        const t = stagger(p.value, i, 3);
        return { height: h * t, y: 264 - h * t };
    });
    return <AnimatedRect x={70 + i * 58} width={42} rx={4} fill={i === 2 ? OCHRE : pal.deep} opacity={0.85 - i * 0.1} animatedProps={props} />;
}

export function SavingsIllustration({ size, progress }: Props) {
    const pal = usePalette();
    const p = useProgress(progress);
    const r = 78, c = 2 * Math.PI * r, pct = 0.68;
    const ring = useAnimatedProps(() => ({
        strokeDashoffset: c * (1 - pct * interpolate(p.value, [0.2, 1], [0, 1], Extrapolation.CLAMP)),
    }));
    return (
        <Svg width={size} height={size} {...svgProps}>
            <Circle cx={150} cy={140} r={r} fill={pal.paper} stroke={pal.rule} strokeWidth={14} />
            <AnimatedCircle
                cx={150} cy={140} r={r} fill="none" stroke={pal.teal} strokeWidth={14} strokeLinecap="round"
                strokeDasharray={`${c} ${c}`} transform="rotate(-90 150 140)" animatedProps={ring}
            />
            <Rect x={118} y={124} width={64} height={14} rx={3} fill={pal.ink} />
            <Rect x={130} y={146} width={40} height={7} rx={2} fill={pal.muted} />
            {[0, 1, 2].map(i => <Deposit key={i} i={i} p={p} pal={pal} />)}
            <Line x1={56} y1={264} x2={244} y2={264} stroke={pal.ink} strokeWidth={2.5} />
        </Svg>
    );
}

// ── 04 Report: the chart's columns rise ─────────────────────────────────
function Column({ i, h, p, pal }: { i: number; h: number; p: SharedValue<number>; pal: ReturnType<typeof usePalette> }) {
    const props = useAnimatedProps(() => {
        const t = stagger(p.value, i, 5);
        return { height: 110 * h * t, y: 240 - 110 * h * t };
    });
    return <AnimatedRect x={56 + i * 22} width={14} rx={2} fill={i === 3 ? pal.teal : pal.deep} opacity={i === 3 ? 1 : 0.55} animatedProps={props} />;
}

export function ReportIllustration({ size, progress }: Props) {
    const pal = usePalette();
    const p = useProgress(progress);
    const cols = [0.5, 0.72, 0.6, 0.9, 0.66];
    return (
        <Svg width={size} height={size} {...svgProps}>
            <Rect x={150} y={60} width={120} height={150} rx={10} fill={pal.paper} stroke={pal.rule} strokeWidth={2} />
            {[0, 1, 2, 3, 4].map(i => <Line key={`h${i}`} x1={160} y1={96 + i * 22} x2={260} y2={96 + i * 22} stroke={pal.rule} strokeWidth={1.5} />)}
            {[0, 1].map(i => <Line key={`v${i}`} x1={196 + i * 34} y1={78} x2={196 + i * 34} y2={196} stroke={pal.rule} strokeWidth={1.5} />)}
            <Rect x={160} y={70} width={40} height={10} rx={2} fill={pal.income} />
            <Path d="M30 40 H156 L188 72 V262 a10 10 0 0 1 -10 10 H40 a10 10 0 0 1 -10 -10 V50 a10 10 0 0 1 10 -10 Z" fill={pal.paper} stroke={pal.rule} strokeWidth={2} />
            <Path d="M156 40 V72 H188 Z" fill={OCHRE} />
            <Rect x={50} y={62} width={84} height={12} rx={2} fill={pal.ink} />
            <Rect x={50} y={82} width={110} height={6} rx={2} fill={pal.muted} opacity={0.7} />
            <Rect x={50} y={94} width={92} height={6} rx={2} fill={pal.muted} opacity={0.7} />
            <Line x1={50} y1={240} x2={168} y2={240} stroke={pal.ink} strokeWidth={2} />
            {cols.map((h, i) => <Column key={i} i={i} h={h} p={p} pal={pal} />)}
        </Svg>
    );
}
