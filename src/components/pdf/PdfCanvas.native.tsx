import { PdfView } from '@kishannareshpal/expo-pdf';

import type { PdfCanvasProps } from './PdfCanvas.types';

export function PdfCanvas(props: PdfCanvasProps) {
  return <PdfView {...props} />;
}
