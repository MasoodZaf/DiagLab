import { qrSvg } from "../lib/qr";

type QrCodeProps = {
  value: string;
  size?: number;
  className?: string;
};

/** Renders a scannable QR code (server component, inlined SVG — no network). */
export function QrCode({ value, size = 132, className }: QrCodeProps) {
  return (
    <span
      className={className}
      aria-hidden="false"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: qrSvg(value, { size }) }}
    />
  );
}
