import React, { useState } from "react";

export default function RevealableAmount({ value, className = "" }) {
  const [visible, setVisible] = useState(false);

  return (
    <button
      type="button"
      className={`amount-reveal-toggle ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        setVisible((current) => !current);
      }}
      aria-label={visible ? "Hide amount" : "Reveal amount"}
      aria-pressed={visible}
      title={visible ? "Click to hide amount" : "Click to reveal amount"}
    >
      {visible ? value : "*"}
    </button>
  );
}
