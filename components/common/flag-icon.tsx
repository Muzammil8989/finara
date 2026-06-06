import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ALL_FLAGS = require('country-flag-icons/string/3x2/index.cjs') as Record<string, string>;

interface FlagIconProps {
    code: string;
    size?: number;
}

export function FlagIcon({ code, size = 28 }: FlagIconProps) {
    const svg = ALL_FLAGS[code];
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
