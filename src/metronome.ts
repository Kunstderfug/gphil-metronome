type BeatDuration = {
  time: number
  newBeat: boolean
  isBeat1: boolean
}

export type Beat = {
  sampleNumber: number
  time: number
  beat: number
}
const beatNumber = document.getElementById('beat_number')!

const clickTimes = async (): Promise<Beat[]> => {
  const response = await fetch('/RAVEL_G_2_EXPO_76_CLICK_TRACK.json')
  const data = await response.json()
  // console.log(data)
  return data
}

let clicks
async function getClicks() {
  if (!clicks) {
    clicks = await clickTimes()
  }
  return clicks
}
// const clicks = await clickTimes()

const canvas = document.getElementById('metronome_canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')
const audio = new Audio('/RAVEL_G_2_EXPO_76.mp3')
let animate: number | null = null

//@ts-ignore
function drawTriangles(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'purple'

  // Left triangle.
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, ctx.canvas.height)
  ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height)
  ctx.fill()

  // Right triangle.
  ctx.beginPath()
  ctx.moveTo(ctx.canvas.width, 0)
  ctx.lineTo(ctx.canvas.width, ctx.canvas.height)
  ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height)
  ctx.fill()
}

let currentBeat = 0
let currentClick = 0
let metronomeIsPlaying = false
// drawTriangles(ctx!)

export function startMetronome() {
  if (metronomeIsPlaying) stopMetronome()
  // Math! The max angle to rotate the metronome line, in radians.
  const maxRotation = Math.PI - 2 * Math.atan(ctx!.canvas.height / ctx!.canvas.width)

  // The total beats counted.
  const metronomeStartTime = new Date()

  // Frames could be early or late since timing is not exact.
  // Compensate this issue by adjusting for the beat's actual start time.
  let beatActualStartTime = metronomeStartTime.getTime()

  audio.play()

  animate = requestAnimationFrame(animateFrame)

  async function animateFrame() {
    ctx!.save()
    // Clear the canvas.
    ctx!.clearRect(0, 0, ctx!.canvas.width, ctx!.canvas.height)

    // Use translation for the line rotation to make math easier.
    ctx!.translate(ctx!.canvas.width / 2, ctx!.canvas.height)

    // Milliseconds since the metronome start time.
    const now = new Date().getTime()
    const timeSinceStart = now - metronomeStartTime.getTime()

    // The beat duration in milliseconds.
    // If null, then there are no more beats to animate.
    const beatDuration = getBeatDuration(timeSinceStart)
    if (beatDuration === null) {
      // Reset the state to handle if the metronome is started again.
      currentClick = 0
      metronomeIsPlaying = false
      ctx!.restore()
      audio.pause()
      audio.currentTime = 0
      return
    }

    if (beatDuration.newBeat) {
      ++currentBeat
      beatActualStartTime = now
    }

    const frameDiff = now - beatActualStartTime

    let radiansToRotate = 0
    if (frameDiff > 0) {
      radiansToRotate = (maxRotation * frameDiff) / beatDuration.time
      radiansToRotate %= maxRotation * 2
    }

    // Finally draw the moving line.
    drawMovingLine(ctx!, currentBeat, beatDuration, radiansToRotate)

    // Restore to an unrotated state.
    ctx!.restore()

    // Animate the next frame.
    animate = requestAnimationFrame(animateFrame)
  }
}

function drawMovingLine(
  ctx: CanvasRenderingContext2D,
  currentBeat: number,
  beatDuration: BeatDuration,
  radiansToRotate: number
) {
  // The metronome starts on the left. (-1 = left, 1 = right)
  let position = -1
  // Left to right
  if (currentBeat % 2 == 1) {
    position = -1
    ctx.rotate(radiansToRotate)
    // Right to left
  } else {
    position = 1
    ctx.rotate(-radiansToRotate)
  }

  // Change the color and size of the line when there is a beat until shortly after (a small amount of rotation).
  if (radiansToRotate < 0.05) {
    ctx.lineWidth = 5

    // If beat 1, use yellow. Other beats use grey.
    ctx.strokeStyle = beatDuration.isBeat1 ? 'yellow' : 'grey'
  } else {
    ctx.lineWidth = 3
    ctx.strokeStyle = 'green'
  }

  // Draw a line from the bottom middle to the side.

  rotateLine(ctx, position)
}

function rotateLine(ctx: CanvasRenderingContext2D, position: number) {
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo((position * ctx.canvas.width) / 2, -ctx.canvas.height / 2)
  ctx.stroke()
  // console.log((position * ctx.canvas.width) / 2, -ctx.canvas.height / 2)
}
// Input and output in milliseconds.
// Also returns if it is a new beat and if beat 1.
function getBeatDuration(currentPlayTime: number): BeatDuration | null {
  let newBeat = false
  if (currentClick < clicks.length - 1 && currentPlayTime >= clicks[currentClick + 1].time) {
    ++currentClick
    newBeat = true
  }

  beatNumber.textContent = clicks[currentClick].beat.toString()

  if (!metronomeIsPlaying) {
    newBeat = true
    metronomeIsPlaying = true
  }

  if (currentClick >= clicks.length - 1) {
    // If we are on the last beat, then there is infinite duration
    // and the metronome should stop.
    return null
  } else {
    return {
      time: clicks[currentClick + 1].time - clicks[currentClick].time,
      newBeat,
      isBeat1: clicks[currentClick].beat == 1
    }
  }
}

export function stopMetronome() {
  metronomeIsPlaying = false
  audio.pause()
  audio.currentTime = 0
  currentBeat = 0
  currentClick = 0
  ctx!.clearRect(0, 0, ctx!.canvas.width, ctx!.canvas.height)
  ctx!.save()
  ctx!.translate(ctx!.canvas.width / 2, ctx!.canvas.height)
  ctx?.restore()
  cancelAnimationFrame(animate!)
  beatNumber.textContent = ''
}
