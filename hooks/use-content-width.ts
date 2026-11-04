import { useWindowDimensions } from 'react-native';

/**
 * Widest the app's content gets. On tablets and in landscape the app sits in
 * a centred column this wide — a readable "page" — instead of stretching
 * lines of text and charts across the whole screen. Phones are unaffected.
 */
export const MAX_CONTENT_WIDTH = 720;

/** Width available to screen content: the window, capped at MAX_CONTENT_WIDTH. */
export function useContentWidth(): number {
    return Math.min(useWindowDimensions().width, MAX_CONTENT_WIDTH);
}
