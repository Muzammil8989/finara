import { ThemedText } from '@/components/common';
import { getCurrencySymbol } from '@/lib/utils/currency';
import { UserService } from '@/features/user/services/user-service';
import type { MonthlyTotals } from '@/lib/db/queries';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { compactMoney, niceMax, useChartTheme } from '../chart-theme';

interface CashflowBarsProps {
    data: MonthlyTotals[];
    currency: string;
    width: number;
    height?: number;
    /** Hide the y-axis ticks for a compact sparkline-style version. */
    compact?: boolean;
}

/**
 * Income vs spending per month as paired bars. Tap a month to read its exact
 * figures; the latest month is selected by default. Screen readers get one
 * summary sentence plus a focusable button per month.
 */
export function CashflowBars({ data, currency, width, height = 180, compact = false }: CashflowBarsProps) {
    const t = useChartTheme();
    // null = follow the latest month, so data arriving after mount still selects it
    const [picked, setPicked] = useState<number | null>(null);
    const selected = picked != null && picked < data.length ? picked : data.length - 1;
    const sel = data[selected];
    const symbol = getCurrencySymbol(currency);

    const axisW = compact ? 0 : 36;
    const labelH = 18;
    const plotW = Math.max(0, width - axisW);
    const plotH = height - labelH;
    const max = niceMax(Math.max(1, ...data.map(d => Math.max(d.income, d.expense))));
    const groupW = data.length ? plotW / data.length : plotW;
    const barW = Math.min(14, groupW * 0.28);
    const gap = 3;
    const y = (v: number) => plotH - (v / max) * plotH;
    const ticks = compact ? [] : [0, max / 2, max];

    const summary = useMemo(() => {
        if (!data.length) return 'No cash flow data';
        const totalIn = data.reduce((s, d) => s + d.income, 0);
        const totalOut = data.reduce((s, d) => s + d.expense, 0);
        const over = data.filter(d => d.expense > d.income).length;
        return `Income versus spending over ${data.length} months. Total in ${UserService.formatCurrency(totalIn, currency)}, total out ${UserService.formatCurrency(totalOut, currency)}. Spending exceeded income in ${over} of ${data.length} months.`;
    }, [data, currency]);

    if (!data.length) return null;

    return (
        <View>
            {/* Readout for the selected month */}
            {sel && (
                <View className="flex-row items-baseline mb-3" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <ThemedText type="label" className="mr-3">{sel.month} {sel.year}</ThemedText>
                    <View className="w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: t.income }} />
                    <ThemedText type="figure" className="text-[13px] mr-3">{UserService.formatCurrency(sel.income, currency)} in</ThemedText>
                    <View className="w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: t.expense }} />
                    <ThemedText type="figure" className="text-[13px]">{UserService.formatCurrency(sel.expense, currency)} out</ThemedText>
                </View>
            )}

            <View>
                <View accessible accessibilityRole="image" accessibilityLabel={summary}>
                <Svg width={width} height={height}>
                    {/* Gridlines + y ticks */}
                    {ticks.map(v => (
                        <React.Fragment key={v}>
                            <Line x1={axisW} x2={width} y1={y(v)} y2={y(v)} stroke={t.grid} strokeWidth={1} />
                            <SvgText x={axisW - 6} y={y(v) + 3} fontSize={10} fill={t.axis} textAnchor="end" fontFamily={t.axisText.fontFamily}>
                                {compactMoney(v, symbol)}
                            </SvgText>
                        </React.Fragment>
                    ))}
                    {compact && <Line x1={0} x2={width} y1={plotH} y2={plotH} stroke={t.grid} strokeWidth={1} />}

                    {data.map((d, i) => {
                        const cx = axisW + groupW * i + groupW / 2;
                        const dim = i !== selected;
                        return (
                            <React.Fragment key={`${d.year}-${d.month}`}>
                                <Rect
                                    x={cx - barW - gap / 2}
                                    y={y(d.income)}
                                    width={barW}
                                    height={Math.max(0, plotH - y(d.income))}
                                    rx={2}
                                    fill={t.income}
                                    opacity={dim ? 0.45 : 1}
                                />
                                <Rect
                                    x={cx + gap / 2}
                                    y={y(d.expense)}
                                    width={barW}
                                    height={Math.max(0, plotH - y(d.expense))}
                                    rx={2}
                                    fill={t.expense}
                                    opacity={dim ? 0.45 : 1}
                                />
                                <SvgText
                                    x={cx}
                                    y={height - 4}
                                    fontSize={10}
                                    fill={dim ? t.axis : t.ink}
                                    textAnchor="middle"
                                    fontFamily={dim ? t.axisText.fontFamily : t.valueText.fontFamily}
                                >
                                    {d.month}
                                </SvgText>
                            </React.Fragment>
                        );
                    })}
                </Svg>
                </View>

                {/* Invisible tap targets, one per month (≥44px tall) */}
                <View style={{ position: 'absolute', left: axisW, top: 0, width: plotW, height, flexDirection: 'row' }}>
                    {data.map((d, i) => (
                        <Pressable
                            key={`${d.year}-${d.month}`}
                            style={{ flex: 1 }}
                            onPress={() => setPicked(i)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: i === selected }}
                            accessibilityLabel={`${d.month} ${d.year}: ${UserService.formatCurrency(d.income, currency)} in, ${UserService.formatCurrency(d.expense, currency)} out`}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}
