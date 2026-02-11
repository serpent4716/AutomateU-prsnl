import "./GradientText.css";

export default function GradientText({
  children,
  className = "",
   colors = ['#3C8EF8', '#FF6F61', '#F9A825', '#3C8EF8'],
  animationSpeed = 8,
  showBorder = false,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`animated-gradient-text ${className}`}>
      <div className="text-content" style={gradientStyle}>
        {children}
      </div>
    </div>
  );
}
