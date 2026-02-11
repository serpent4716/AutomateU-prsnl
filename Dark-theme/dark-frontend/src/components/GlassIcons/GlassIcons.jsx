import "./GlassIcons.css"

const gradientMapping = {
  emerald: "linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 150, 105) 100%)",
  purple: "linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(126, 34, 206) 100%)",
  amber: "linear-gradient(135deg, rgb(251, 191, 36) 0%, rgb(217, 119, 6) 100%)",
  cyan: "linear-gradient(135deg, rgb(34, 211, 238) 0%, rgb(6, 182, 212) 100%)",
  blue: "linear-gradient(135deg, rgb(96, 165, 250) 0%, rgb(37, 99, 235) 100%)",
  violet: "linear-gradient(135deg, rgb(167, 139, 250) 0%, rgb(109, 40, 217) 100%)",
  teal: "linear-gradient(135deg, rgb(45, 212, 191) 0%, rgb(13, 148, 136) 100%)",
  pink: "linear-gradient(135deg, rgb(244, 114, 182) 0%, rgb(236, 72, 153) 100%)",
}

const GlassIcons = ({ items, className }) => {
  const getBackgroundStyle = (color) => {
    if (gradientMapping[color]) {
      return { background: gradientMapping[color] }
    }
    return { background: color }
  }

  return (
    <div className={`icon-btns ${className || ""}`}>
      {items.map((item, index) => (
        <button key={index} className={`icon-btn ${item.customClass || ""}`} aria-label={item.label} type="button">
          <span className="icon-btn__back" style={getBackgroundStyle(item.color)}></span>
          <span className="icon-btn__front">
            <span className="icon-btn__icon" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span className="icon-btn__label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export default GlassIcons
