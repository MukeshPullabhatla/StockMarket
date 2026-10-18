import { useEffect, useRef } from 'react'

// Animated "neural network" backdrop: drifting nodes that link up when close,
// with signal pulses travelling along links and the cursor acting as a node.
// `calm` lowers density and brightness for data-heavy pages like the dashboard.

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  color: string
  phase: number
}

interface Pulse {
  from: Node
  to: Node
  t: number
  speed: number
}

const COLORS = ['167, 139, 250', '96, 165, 250', '34, 211, 238'] // violet, blue, cyan
const LINK_DISTANCE = 150
const MOUSE_DISTANCE = 200

interface Props {
  calm?: boolean
}

export function NeuralBackground({ calm = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const brightness = calm ? 0.45 : 1
    let width = 0
    let height = 0
    let nodes: Node[] = []
    let pulses: Pulse[] = []
    let frame = 0
    let lastPulse = 0
    const mouse = { x: -9999, y: -9999, active: false }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const areaPerNode = calm ? 26000 : 13000
      const count = Math.min(150, Math.max(24, Math.round((width * height) / areaPerNode)))
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.8,
        color: COLORS[i % COLORS.length],
        phase: Math.random() * Math.PI * 2,
      }))
      pulses = []
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height)

      if (!reduceMotion) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < -20) n.x = width + 20
          if (n.x > width + 20) n.x = -20
          if (n.y < -20) n.y = height + 20
          if (n.y > height + 20) n.y = -20
        }
      }

      // Links between nearby nodes
      const neighbours: [Node, Node][] = []
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * 0.28 * brightness
            ctx!.strokeStyle = `rgba(${a.color}, ${alpha})`
            ctx!.lineWidth = 1
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.stroke()
            neighbours.push([a, b])
          }
        }
      }

      // Cursor links
      if (mouse.active) {
        for (const n of nodes) {
          const dx = n.x - mouse.x
          const dy = n.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_DISTANCE) {
            const alpha = (1 - dist / MOUSE_DISTANCE) * 0.55 * brightness
            ctx!.strokeStyle = `rgba(${n.color}, ${alpha})`
            ctx!.lineWidth = 1.2
            ctx!.beginPath()
            ctx!.moveTo(n.x, n.y)
            ctx!.lineTo(mouse.x, mouse.y)
            ctx!.stroke()
          }
        }
      }

      // Signal pulses travelling along links
      if (!reduceMotion && neighbours.length && time - lastPulse > (calm ? 900 : 350)) {
        const [from, to] = neighbours[Math.floor(Math.random() * neighbours.length)]
        pulses.push({ from, to, t: 0, speed: 0.012 + Math.random() * 0.012 })
        lastPulse = time
      }
      pulses = pulses.filter((p) => p.t <= 1)
      for (const p of pulses) {
        p.t += p.speed
        const x = p.from.x + (p.to.x - p.from.x) * p.t
        const y = p.from.y + (p.to.y - p.from.y) * p.t
        const glow = ctx!.createRadialGradient(x, y, 0, x, y, 8)
        glow.addColorStop(0, `rgba(${p.from.color}, ${0.9 * brightness})`)
        glow.addColorStop(1, `rgba(${p.from.color}, 0)`)
        ctx!.fillStyle = glow
        ctx!.beginPath()
        ctx!.arc(x, y, 8, 0, Math.PI * 2)
        ctx!.fill()
      }

      // Nodes, gently twinkling
      for (const n of nodes) {
        const twinkle = reduceMotion ? 0.8 : 0.6 + 0.4 * Math.sin(time / 900 + n.phase)
        ctx!.fillStyle = `rgba(${n.color}, ${0.12 * twinkle * brightness})`
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2)
        ctx!.fill()
        ctx!.fillStyle = `rgba(${n.color}, ${0.85 * twinkle * brightness})`
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx!.fill()
      }
    }

    function loop(time: number) {
      draw(time)
      frame = requestAnimationFrame(loop)
    }

    function start() {
      cancelAnimationFrame(frame)
      if (reduceMotion) draw(0)
      else frame = requestAnimationFrame(loop)
    }

    let resizeTimer = 0
    function onResize() {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        resize()
        start()
      }, 150)
    }

    function onPointerMove(e: PointerEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = e.pointerType === 'mouse'
      if (reduceMotion) draw(0)
    }

    function onPointerLeave() {
      mouse.active = false
    }

    // Pause the animation while the tab is hidden to save battery
    function onVisibility() {
      if (document.hidden) cancelAnimationFrame(frame)
      else start()
    }

    resize()
    start()
    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onPointerMove)
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [calm])

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="aurora">
        <span className="aurora-blob aurora-violet" />
        <span className="aurora-blob aurora-blue" />
        <span className="aurora-blob aurora-cyan" />
      </div>
      <div className="grid-overlay" />
      <canvas ref={canvasRef} className="neural-canvas" />
    </div>
  )
}
