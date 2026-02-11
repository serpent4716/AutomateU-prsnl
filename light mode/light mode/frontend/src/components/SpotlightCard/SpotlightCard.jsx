import { useRef, useState, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";

const SpotlightCard = ({
  children,
  className = "",
}) => {
  const { theme } = useContext(ThemeContext);
  const divRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const spotlightColor = theme === 'light' ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.25)";

  const handleMouseMove = (e) => {
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty("--mouse-x", `${x}px`);
    divRef.current.style.setProperty("--mouse-y", `${y}px`);
    divRef.current.style.setProperty("--spotlight-color", spotlightColor);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className={`relative overflow-hidden rounded-xl 
                  before:content-[''] before:absolute before:inset-0 before:rounded-[inherit]
                  before:bg-radial-spotlight before:opacity-0 before:transition-opacity before:duration-500 before:ease-in-out
                  hover:before:opacity-60 focus-within:before:opacity-60
                  ${className}`}
    >
      {typeof children === "function" ? children(isFocused) : children}
      <style jsx>{`
        .bg-radial-spotlight::before {
          background: radial-gradient(
            circle at var(--mouse-x) var(--mouse-y),
            var(--spotlight-color),
            transparent 80%
          );
        }
      `}</style>
    </div>
  );
};

export default SpotlightCard;
