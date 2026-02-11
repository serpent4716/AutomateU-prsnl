import Lottie from "lottie-react"

const BookOpenIcon = ({ className = "" }) => {
  const animationData = {
    v: "5.7.6",
    fr: 60,
    ip: 0,
    op: 120,
    w: 200,
    h: 200,
    nm: "Book Open",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Book",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
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
                d: 1,
                ty: "el",
                s: { a: 0, k: [80, 80] },
                p: { a: 0, k: [0, 0] },
                nm: "Ellipse Path 1",
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
    <div className={`w-6 h-6 ${className}`}>
      <Lottie animationData={animationData} loop={true} />
    </div>
  )
}

export default BookOpenIcon
