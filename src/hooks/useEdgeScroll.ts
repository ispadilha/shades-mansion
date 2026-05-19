import { useEffect } from "react"
import type { RefObject } from "react"

interface UseEdgeScrollOptions {
    edgeSize?: number
    maxSpeed?: number
    enabled?: boolean
}

export function useEdgeScroll<T extends HTMLElement>(
    ref: RefObject<T | null>,
    { edgeSize = 80, maxSpeed = 20, enabled = true }: UseEdgeScrollOptions = {}
) {
    useEffect(() => {
        const container = ref.current
        if (!container || !enabled) return

        const mouse = { x: 0, y: 0, inside: false }
        let rafId = 0

        const onMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX
            mouse.y = e.clientY
            mouse.inside = true
        }
        const onDocumentLeave = () => {
            mouse.inside = false
        }

        const tick = () => {
            if (mouse.inside) {
                const rect = container.getBoundingClientRect()
                const x = mouse.x - rect.left
                const y = mouse.y - rect.top

                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    let dx = 0
                    let dy = 0

                    if (x < edgeSize) dx = -((edgeSize - x) / edgeSize) * maxSpeed
                    else if (x > rect.width - edgeSize) dx = ((x - (rect.width - edgeSize)) / edgeSize) * maxSpeed

                    if (y < edgeSize) dy = -((edgeSize - y) / edgeSize) * maxSpeed
                    else if (y > rect.height - edgeSize) dy = ((y - (rect.height - edgeSize)) / edgeSize) * maxSpeed

                    if (dx !== 0) container.scrollLeft += dx
                    if (dy !== 0) container.scrollTop += dy
                }
            }
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)

        window.addEventListener("mousemove", onMouseMove)
        document.addEventListener("mouseleave", onDocumentLeave)

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener("mousemove", onMouseMove)
            document.removeEventListener("mouseleave", onDocumentLeave)
        }
    }, [ref, edgeSize, maxSpeed, enabled])
}
