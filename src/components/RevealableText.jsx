import React, { useState } from "react";

export default function RevealableText({ value, className = "" }) {
  const [visible, setVisible] = useState(false);

  return (
    <button
      type="button"
      className={`sensitive-value-toggle ${className}`.trim()}
      onClick={(event) => {
        event.stopPropagation();
        setVisible((current) => !current);
      }}
      aria-label={visible ? "Hide personal information" : "Reveal personal information"}
      aria-pressed={visible}
      title={visible ? "Click to hide personal information" : "Click to reveal personal information"}
    >
      {visible ? value || "—" : "*"}
    </button>
  );
}
