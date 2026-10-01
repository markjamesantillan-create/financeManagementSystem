import React from "react";

// The gold peso coin that marks the OUTSTANDING RECEIVABLES card on the Dashboard.
//
// WHY THE TILE FROM THE REFERENCE ART IS NOT DRAWN HERE
// The artwork is a cream rounded square with a gold coin on it. Stat already wraps every icon
// in `.stat-icon` (index.css), and the `orange` tone of that chip is the same cream rounded
// square at the same size, so drawing the tile too would stack two of them inside each other.
// This component therefore draws the coin only and lets the chip be the tile -- the card ends
// up looking like the reference without touching the shared stat-card styles.
//
// WHY IT IS NOT A LUCIDE ICON
// lucide-react is the icon set the rest of the app uses, but it has no peso coin. The closest
// match, CircleDollarSign, is a US dollar sign, which is why this one file is hand-written.
//
// WHY IT ACCEPTS size AND strokeWidth
// Stat renders its icon as `<Icon size={20} strokeWidth={2.5} />`, so this keeps that call
// signature and simply ignores strokeWidth -- the coin is built from flat fills, not strokes,
// so there is nothing for it to outline.
//
// The fills are flat on purpose: at 20px a gradient reads as banding, and flat fills let the
// icon avoid <defs> ids that would collide if two instances ever shared a page.
const PesoCoinIcon = ({ size = 20, className = "", ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 32 32"
    className={className}
    // The icon never carries information -- the card's title does -- so it is hidden from
    // assistive technology, exactly as lucide's icons are.
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {/* the rim */}
    <circle cx="16" cy="16" r="15" fill="#EFA41B" />
    {/* the thin pale ring that separates the rim from the face */}
    <circle cx="16" cy="16" r="12.9" fill="#F8E0A0" />
    {/* the face */}
    <circle cx="16" cy="16" r="11.4" fill="#E9A200" />
    {/* the peso sign: a P whose stem runs past the bowl, with the two crossing bars */}
    <path
      d="M12.8 9.6H16.6C19.4 9.6 20.6 11 20.6 12.8C20.6 14.6 19.4 16 16.6 16H14.9V22.6H12.8Z"
      fill="#FFFFFF"
    />
    <rect x="11" y="11.9" width="10.3" height="1.7" fill="#FFFFFF" />
    <rect x="11" y="15.1" width="10.3" height="1.7" fill="#FFFFFF" />
  </svg>
);

export default PesoCoinIcon;
