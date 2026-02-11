import { useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";

const SpotlightCard = ({ children, className = "", spotlightColor }) => {
  const { theme } = useTheme();   // ✅ FIXED
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // If Dashboard provides a glow → use it.
  // Otherwise fallback to default.
  const finalColor =
    spotlightColor ||
    (theme === "light"
      ? "rgba(0,0,0,0.1)"
      : "rgba(255,255,255,0.25)");

  const handleMouseMove = (e) => {
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
    divRef.current.style.setProperty("--spotlight-color", finalColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`
        relative overflow-hidden rounded-xl

        before:absolute before:inset-0 before:rounded-[inherit]
        before:bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),var(--spotlight-color),transparent_70%)]
        before:opacity-0 before:transition-opacity before:duration-500
        hover:before:opacity-60
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
