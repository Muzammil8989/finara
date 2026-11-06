import { ThemedText } from '@/components/common';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { UserService } from '@/features/user/services/user-service';
import type { MonthlyTotals } from '@/lib/db/queries';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { compactMoney, niceMax, useChartTheme } from '../chart-theme';
import { ChartTooltip, axisLabelWidth, indexAt, useChartScrub, useMeasuredWidth } from './chart-card';

interface CashflowBarsProps {
    data: MonthlyTotals[];
    currency: string;
    /** Fixed width; when omitted the chart fills its container. */
    width?: number;
    height?: number;
    /** Hide the y-axis ticks for a compact sparkline-style version. */
    compact?: boolean;
}

const LABEL_H = 20; // month labels under the plot
const TOP_PAD = 8;  // room for the top tick label

/**
 * Income vs spending per month as paired bars. Touch or drag across the
 * chart to read a month's figures in a tooltip; it hides once you let go.
 * Screen readers get a summary plus an adjustable month picker.
 */
function CashflowBarsInner({ data, currency, width: fixedWidth, height = 180, compact = false }: CashflowBarsProps) {
    const t = useChartTheme();
    const [measured, onLayout] = useMeasuredWidth();
    const width = fixedWidth ?? measured;
    const symbol = getCurrencySymbol(currency);

    const max = niceMax(Math.max(1, ...data.map(d => Math.max(d.income, d.expense))));
    const ticks = compact ? [] : [0, max / 2, max];
    const tickLabels = ticks.map(v => compactMoney(v, symbol));
    const axisW = compact ? 0 : axisLabelWidth(tickLabels);
    const plotW = Math.max(0, width - axisW);
    const plotH = height - LABEL_H - TOP_PAD;
    const groupW = data.length ? plotW / data.length : plotW;
    const gap = groupW < 16 ? 1 : 3;
    const barW = Math.max(2, Math.min(18, (groupW * 0.62 - gap) / 2));
    const y = (v: number) => TOP_PAD + plotH - (v / max) * plotH;
    // Thin out month labels when they'd collide (e.g. 12 months on a small phone).
    const labelStep = groupW >= 28 ? 1 : groupW >= 15 ? 2 : 3;

    const { active, handlers, select } = useChartScrub(x => indexAt(x, axisW, plotW, data.length));
    const sel = active != null && active < data.length ? data[active] : null;

    const summary = useMemo(() => {
        if (!data.length) return 'No cash flow data';
        const totalIn = data.reduce((s, d) => s + d.income, 0);
        const totalOut = data.reduce((s, d) => s + d.expense, 0);
        const over = data.filter(d => d.expense > d.income).length;
        return `Income versus spending over ${data.length} months. Total in ${UserService.formatCurrency(totalIn, currency)}, total out ${UserService.formatCurrency(totalOut, currency)}. Spending exceeded income in ${over} of ${data.length} months.`;
    }, [data, currency]);

    if (!data.length) return null;

    const net = sel ? sel.income - sel.expense : 0;
    const selCx = active != null ? axisW + groupW * active + groupW / 2 : 0;
    const selTop = sel ? y(Math.max(sel.income, sel.expense)) : 0;

    return (
        <View onLayout={fixedWidth == null ? onLayout : undefined} style={{ minHeight: height }}>
            {width > 0 && (
                <>
                    <View accessible accessibilityRole="image" accessibilityLabel={summary}>
                        <Svg width={width} height={height}>
                            {/* Touched month's column */}
                            {active != null && (
                                <Rect
                                    x={axisW + groupW * active + 1}
                                    y={TOP_PAD}
                                    width={Math.max(0, groupW - 2)}
                                    height={plotH}
                                    rx={6}
                                    fill={t.grid}
                                    opacity={0.55}
                                />
                            )}

                            {/* Gridlines + y ticks */}
                            {ticks.map((v, i) => (
                                <React.Fragment key={v}>
                                    <Line x1={axisW} x2={width} y1={y(v)} y2={y(v)} stroke={t.grid} strokeWidth={1} />
                                    <SvgText x={axisW - 6} y={y(v) + 3.5} fontSize={10} fill={t.axis} textAnchor="end" fontFamily={t.axisText.fontFamily}>
                                        {tickLabels[i]}
                                    </SvgText>
                                </React.Fragment>
                            ))}
                            {compact && <Line x1={0} x2={width} y1={y(0)} y2={y(0)} stroke={t.grid} strokeWidth={1} />}

                            {data.map((d, i) => {
                                const cx = axisW + groupW * i + groupW / 2;
                                const dim = active != null && i !== active;
                                const showLabel = (data.length - 1 - i) % labelStep === 0;
                                return (
                                    <React.Fragment key={`${d.year}-${d.month}`}>
                                        <Rect
                                            x={cx - barW - gap / 2}
                                            y={y(d.income)}
                                            width={barW}
                                            height={Math.max(0, y(0) - y(d.income))}
                                            rx={Math.min(3, barW / 2)}
                                            fill={t.income}
                                            opacity={dim ? 0.4 : 1}
                                        />
                                        <Rect
                                            x={cx + gap / 2}
                                            y={y(d.expense)}
                                            width={barW}
                                            height={Math.max(0, y(0) - y(d.expense))}
                                            rx={Math.min(3, barW / 2)}
                                            fill={t.expense}
                                            opacity={dim ? 0.4 : 1}
                                        />
                                        {showLabel && (
                                            <SvgText
                                                x={cx}
                                                y={height - 5}
                                                fontSize={10}
                                                fill={i === active ? t.ink : t.axis}
                                                textAnchor="middle"
                                                fontFamily={i === active ? t.valueText.fontFamily : t.axisText.fontFamily}
                                            >
                                                {d.month}
                                            </SvgText>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Svg>
                    </View>

                    {sel && (
                        <ChartTooltip x={selCx} y={selTop} width={width}>
                            <ThemedText type="label" className="text-[11px] leading-4" style={{ color: t.surface }}>
                                {sel.month} {sel.year} · net {net < 0 ? '−' : '+'}{UserService.formatCurrency(Math.abs(net), currency)}
                            </ThemedText>
                            <View className="flex-row items-center mt-0.5">
                                <View className="w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: t.income }} />
                                <ThemedText type="figure" className="text-[12px] leading-4 mr-2.5" style={{ color: t.surface }}>
                                    {UserService.formatCurrency(sel.income, currency)}
                                </ThemedText>
                                <View className="w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: t.expense }} />
                                <ThemedText type="figure" className="text-[12px] leading-4" style={{ color: t.surface }}>
                                    {UserService.formatCurrency(sel.expense, currency)}
                                </ThemedText>
                            </View>
                        </ChartTooltip>
                    )}

                    {/* Touch layer: touch or drag to show a month */}
                    <View
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, height }}
                        {...handlers}
                        accessible
                        accessibilityRole="adjustable"
                        accessibilityLabel="Month"
                        accessibilityHint="Swipe up or down to read each month"
                        accessibilityValue={{ text: sel ? `${sel.month} ${sel.year}: ${UserService.formatCurrency(sel.income, currency)} in, ${UserService.formatCurrency(sel.expense, currency)} out` : 'None selected' }}
                        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                        onAccessibilityAction={e => {
                            const step = e.nativeEvent.actionName === 'increment' ? 1 : -1;
                            const from = active ?? (step > 0 ? -1 : data.length);
                            select(Math.max(0, Math.min(data.length - 1, from + step)));
                        }}
                    />
                </>
            )}
        </View>
    );
}

// Memoized: the Insights screen re-renders while loading and on period changes.
export const CashflowBars = React.memo(CashflowBarsInner);
