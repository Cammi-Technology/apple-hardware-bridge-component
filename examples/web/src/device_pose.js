// How the device icon on the Posture page should look, from the body's
// data-device-posture and data-device-orientation.
//
// The drawing is the iPhone Duo's inner screen: two halves side by side
// with the fold down the middle. Each pose folds the halves (the shape)
// and turns the whole phone (rotate, in degrees).
//
//   closed   the cover screen: one half, upright in portrait
//   open     both halves flat. The fold runs down the screen in
//            landscape, across it in portrait
//   book     half open, the fold top to bottom, like a book
//   laptop   half open, the fold side to side, like a laptop
//   tent     the cover screen, half open, standing on its edges

const WORDS = {
  closed: "closed",
  open: "open flat",
  book: "book mode",
  laptop: "laptop mode",
  tent: "tent mode"
}

const ORIENTATION_WORDS = {
  portrait: "portrait",
  "portrait-upside-down": "portrait, upside down",
  "landscape-left": "landscape",
  "landscape-right": "landscape"
}

// The cover screen is drawn upright, the inner screen sideways.
const COVER_TURN = { portrait: 0, "portrait-upside-down": 180, "landscape-left": 90, "landscape-right": -90 }
const INNER_TURN = { portrait: 90, "portrait-upside-down": -90, "landscape-left": 0, "landscape-right": 0 }

export function devicePose({ posture, orientation } = {}) {
  if (!posture) {
    return { shape: "closed", rotate: 0, label: "A phone. This browser sends no device", caption: "No device data here" }
  }
  const shape = WORDS[posture] ? posture : "closed"
  let rotate
  if (shape === "book") rotate = 0
  else if (shape === "laptop") rotate = orientation === "portrait-upside-down" ? -90 : 90
  else if (shape === "closed" || shape === "tent") rotate = COVER_TURN[orientation] ?? 0
  else rotate = INNER_TURN[orientation] ?? 0

  const how = WORDS[shape]
  const held = ORIENTATION_WORDS[orientation]
  const caption = held ? `${how[0].toUpperCase()}${how.slice(1)}, ${held}` : `${how[0].toUpperCase()}${how.slice(1)}`
  return { shape, rotate, label: `iPhone Duo, ${held ? `${how}, ${held}` : how}`, caption }
}

// Waits a moment after the last change before acting, so a burst of
// updates (the hinge moving, then the fold settling) turns the icon
// once, and it feels like it noticed. Pass your own timers in tests.
export function delayed(action, ms, timers = globalThis) {
  let handle = null
  const run = (...args) => {
    if (handle !== null) timers.clearTimeout(handle)
    handle = timers.setTimeout(() => {
      handle = null
      action(...args)
    }, ms)
  }
  run.cancel = () => {
    if (handle !== null) timers.clearTimeout(handle)
    handle = null
  }
  return run
}

// With reduced motion there is no pause and no animation: the icon
// jumps straight to the new pose. The pause is the page's
// --duo-move-delay, so the icon and the layout move as one.
export function motionPlan(reduced, delay = 250) {
  return reduced ? { delay: 0, animate: false } : { delay, animate: true }
}
