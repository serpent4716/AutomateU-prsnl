import Lottie from "lottie-react"

const PenToolIcon = ({ className = "" }) => {
  const animationData = {
    v: "5.7.6",
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: "Pen",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Pen",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: {
            a: [
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] },
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 60, s: [-15] },
              { t: 120, s: [0] },
            ],
          },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ind: 0,
                ty: "sh",
                ks: {
                  a: 0,
                  k: {
                    c: false,
                    v: [
                      [-30, 30],
                      [30, -30],
                    ],
                    i: [
                      [0, 0],
                      [0, 0],
                    ],
                    o: [
                      [0, 0],
                      [0, 0],
                    ],
                  },
                },
                nm: "Path 1",
                hd: false,
              },
              {
                ty: "st",
                c: { a: 0, k: [1, 1, 1, 1] },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 3 },
                lc: 1,
                lj: 1,
                ml: 4,
                nm: "Stroke 1",
                hd: false,
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
                nm: "Transform",
              },
            ],
            nm: "Group 1",
            hd: false,
          },
        ],
      },
    ],
  }

  return (
    <div className={`w-6 h-6 invert dark:invert-0 ${className}`}>
      <Lottie animationData={animationData} loop={true} />
    </div>
  )
}

export default PenToolIcon
