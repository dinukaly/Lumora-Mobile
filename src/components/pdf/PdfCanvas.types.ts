import type { FitMode } from '@kishannareshpal/expo-pdf';
import type { ViewStyle } from 'react-native';

export type PdfCanvasProps = {
  uri: string;
  style?: ViewStyle;
  autoScale?: boolean;
  doubleTapToZoom?: boolean;
  fitMode?: FitMode;
  pageGap?: number;
  contentPadding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  onLoadComplete?: (payload?: { pageCount?: number }) => void;
  onPageChanged?: (payload?: { pageIndex?: number; pageCount?: number }) => void;
  onError?: (params: { code?: string; message: string }) => void;
};
