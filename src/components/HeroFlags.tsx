"use client"

const FLAGS = [
  "/flags/us.png",
  "/flags/germany.png",
  "/flags/uk.png",
  "/flags/france.png",
  "/flags/italy.png",
  "/flags/spain.png",
  "/flags/netherlands.png",
  "/flags/sweden.png",
  "/flags/norway.png",
  "/flags/denmark.png",
  "/flags/finland.png",
  "/flags/poland.png",
  "/flags/canada.png",
  "/flags/brazil.png",
  "/flags/mexico.png",
  "/flags/argentina.png",
  "/flags/australia.png",
  "/flags/newzealand.png",
  "/flags/japan.png",
  "/flags/southkorea.png",
  "/flags/india.png",
  "/flags/china.png",
  "/flags/singapore.png",
  "/flags/switzerland.png",
  "/flags/austria.png",
  "/flags/belgium.png",
  "/flags/portugal.png",
  "/flags/greece.png",
  "/flags/turkey.png",
  "/flags/uae.png",
  "/flags/saudi.png"
]

function random(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function HeroFlags() {
  return (
    <div className="relative w-full h-[420px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 shadow-inner">
      {Array.from({ length: 40 }).map((_, i) => {
        const flag = FLAGS[i % FLAGS.length]
        const size = random(70, 130)
        const left = random(0, 95)
        const delay = random(0, 15)
        const duration = random(18, 40)
        const rotate = random(-25, 25)

        return (
          <img
            key={i}
            src={flag}
            alt=""
            className="absolute opacity-95 hero-flag-fall"
            style={{
              width: `${size}px`,
              height: `${size * 0.67}px`,
              left: `${left}%`,
              top: `-${size}px`,
              transform: `rotate(${rotate}deg)`,
              animation: `heroFlagFall ${duration}s linear infinite`,
              animationDelay: `${delay}s`
            }}
            onError={(e) => {
              e.currentTarget.src = "/flags/us.png";
            }}
          />
        )
      })}
    </div>
  )
}
