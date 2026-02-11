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
    <div className={`flex flex-col gap-3 p-4 overflow-visible ${className || ""}`}>
      {items.map((item, index) => (
        <button 
          key={index} 
          className={`group bg-transparent outline-none relative w-14 h-14 border-none cursor-pointer`}
          style={{ perspective: "24em", transformStyle: "preserve-3d" }}
          aria-label={item.label} 
          type="button"
        >
          <span 
            className="absolute top-0 left-0 w-full h-full rounded-2xl block origin-bottom-right transition-transform duration-300 ease-in-out
                       shadow-md dark:shadow-black/30
                       group-hover:rotate-[20deg] group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:translate-z-2
                       group-focus-visible:rotate-[20deg] group-focus-visible:-translate-x-1 group-focus-visible:-translate-y-1 group-focus-visible:translate-z-2"
            style={getBackgroundStyle(item.color)}
          ></span>
          <span 
            className="absolute top-0 left-0 w-full h-full rounded-2xl flex origin-[80%_50%] transition-all duration-300 ease-in-out
                       bg-black/5 dark:bg-white/10
                       shadow-inner-white-sm dark:shadow-inner-white-md
                       backdrop-blur-md
                       border border-black/10 dark:border-white/15
                       group-hover:translate-z-6 group-hover:shadow-lg dark:group-hover:shadow-black/20
                       group-focus-visible:translate-z-6 group-focus-visible:shadow-lg dark:group-focus-visible:shadow-black/20"
          >
            <span className="m-auto w-5 h-5 flex items-center justify-center text-black dark:text-white" aria-hidden="true">
              {item.icon}
            </span>
          </span>
          <span 
            className="text-xs whitespace-nowrap text-center leading-normal absolute top-full right-0 left-0 mt-2
                       text-black/80 dark:text-white/80 font-medium
                       opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100
                       transition-opacity duration-300 ease-in-out"
          >
            {item.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export default GlassIcons;
