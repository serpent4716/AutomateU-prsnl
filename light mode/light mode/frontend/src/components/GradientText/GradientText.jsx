export default function GradientText({
  children,
  className = "",
  colors = ['#3C8EF8', '#FF6F61', '#F9A825', '#3C8EF8'],
  animationSpeed = 8,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${colors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div 
        className="text-content bg-clip-text text-transparent animate-gradient"
        style={{
          ...gradientStyle,
          backgroundSize: '300% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div 
          className="dark:[-webkit-text-stroke:0.5px_rgba(255,255,255,0.3)] dark:[text-shadow:0_0_1px_rgba(255,255,255,0.2),_0_0_2px_rgba(255,255,255,0.15)]"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
