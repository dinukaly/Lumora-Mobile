import type { CSSProperties } from 'react';

import type { PdfCanvasProps } from './PdfCanvas.types';

export function PdfCanvas({
  uri,
  style,
  onLoadComplete,
  onError,
}: PdfCanvasProps) {
  const iframeStyle = {
    border: 'none',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    ...style,
  } as CSSProperties;

  return (
    <iframe
      onError={() =>
      onError?.({
          code: 'invalid_uri',
          message: 'Unable to render this PDF in the web preview.',
        })
      }
      onLoad={() => onLoadComplete?.()}
      src={uri}
      style={iframeStyle}
      title="Document PDF"
    />
  );
}
