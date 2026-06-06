import { AppCard } from '@/components/common';
import { useThemeColors } from '@/hooks/use-theme-colors';
import React from 'react';
import { LineChart } from 'react-native-gifted-charts';
import { CHART_WIDTH } from './utils';

interface DailySpendingCardProps {
    lineData: { value: number; dataPointText: string }[];
}

export function DailySpendingCard({ lineData }: DailySpendingCardProps) {
    const colors = useThemeColors();
    const isDark = useColorScheme() === 'dark';

    return (
        <AppCard className="p-5 mb-5" circleSize={100} circleOffset={28}>
            <LineChart
                data={lineData}
                width={CHART_WIDTH - 40}
                height={120}
                color={colors.primary}
                thickness={2.5}
                hideDataPoints={lineData.length > 15}
                dataPointsColor={colors.primary}
                dataPointsRadius={4}
                curved
                areaChart
                startFillColor={`${colors.primary}40`}
                endFillColor={`${colors.primary}00`}
                hideRules
                hideAxesAndRules
                xAxisThickness={0}
                yAxisThickness={0}
                isAnimated
            />
        </AppCard>
    );
}
