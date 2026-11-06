import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// ~180 KB of SVG strings: loaded on first flag render, not at app start (the common barrel re-exports this file).
let allFlags: Record<string, string> | null = null;
function getFlags(): Record<string, string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    allFlags ??= require('country-flag-icons/string/3x2/index.cjs') as Record<string, string>;
    return allFlags;
}

interface FlagIconProps {
    code: string;
    size?: number;
}

export function FlagIcon({ code, size = 28 }: FlagIconProps) {
    const svg = getFlags()[code];
    const width = Math.round(size * (3 / 2)); // 3x2 aspect ratio
    const height = size;

    if (!svg) {
        return (
            <View
                style={{
                    width,
                    height,
                    borderRadius: 3,
                    backgroundColor: '#e5e7eb',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            />
        );
    }

    return (
        <View style={{ width, height, borderRadius: 3, overflow: 'hidden' }}>
            <SvgXml xml={svg} width={width} height={height} />
        </View>
    );
}
