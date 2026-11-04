import { ThemedText } from '@/components/common';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useChartTheme } from '../chart-theme';
import { useChartWidth } from '../utils';

interface DailySpendingCardProps {
    lineData: { value: number; dataPointText: string }[];
    /** Formats the average for the caption, e.g. UserService.formatCurrency. */
    formatValue?: (n: number) => string;
}

/**
 * Daily spending this month: a thin area line with a dashed average rule.
 * The caption states the average and the peak day in words.
 */
export function DailySpendingCard({ lineData, formatValue = n => n.toFixed(2) }: DailySpendingCardProps) {
    const t = useChartTheme();
    const chartWidth = useChartWidth() - 8;

    const { avg, peakIdx, peak } = useMemo(() => {
        const values = lineData.map(d => d.value);
        const sum = values.reduce((s, v) => s + v, 0);
        const peakIdx = values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
        return { avg: values.length ? sum / values.length : 0, peakIdx, peak: values[peakIdx] ?? 0 };
    }, [lineData]);

    const data = useMemo(
        () => lineData.map((d, i) => ({
            value: d.value,
            label: i === 0 || (i + 1) % 7 === 0 ? String(i + 1) : '',
        })),
        [lineData],
    );
    const spacing = data.length > 1 ? (chartWidth - 24) / (data.length - 1) : chartWidth;

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Daily spending this month. Average ${formatValue(avg)} a day. Highest on day ${peakIdx + 1} at ${formatValue(peak)}.`}
        >
            <LineChart
                data={data}
                width={chartWidth - 24}
                height={130}
                spacing={spacing}
                initialSpacing={0}
                endSpacing={0}
                color={t.accent}
                thickness={2}
                hideDataPoints
                areaChart
                startFillColor={t.accent}
                endFillColor={t.accent}
                startOpacity={0.14}
                endOpacity={0.01}
                showReferenceLine1
                referenceLine1Position={avg}
                referenceLine1Config={{ color: t.muted, dashWidth: 4, dashGap: 4, thickness: 1 }}
                rulesColor={t.grid}
                rulesType="solid"
                noOfSections={3}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={t.grid}
                yAxisTextStyle={t.axisText}
                xAxisLabelTextStyle={t.axisText}
                yAxisLabelWidth={24}
                formatYLabel={(v: string) => {
                    const n = Number(v);
                    return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));
                }}
                isAnimated={false}
            />
            <View className="flex-row items-center mt-2">
                <View style={{ width: 14, height: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: t.muted, marginRight: 6 }} />
                <ThemedText type="caption">
                    Average {formatValue(avg)}/day · peak day {peakIdx + 1} at {formatValue(peak)}
                </ThemedText>
            </View>
        </View>
    );
}
