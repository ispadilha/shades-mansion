import React from "react"
import type { PixelGrid } from "../../assets/pixels"

interface PixelImageProps {
    grid: PixelGrid
    // Quantos pixels da tela cada pixel da imagem ocupa
    pixel: number
}

// Uma imagem em pixels desenhada em SVG, sem suavização: um caminho para cada cor, com um
// retângulo para cada trecho seguido de pixels dela numa linha
export const PixelImage: React.FC<PixelImageProps> = ({ grid, pixel }) => {
    const width = grid[0]?.length ?? 0
    const paths = new Map<string, string>()

    grid.forEach((row, y) => {
        let x = 0
        while (x < width) {
            const color = row[x]
            let end = x + 1
            while (end < width && row[end] === color) end++
            if (color) paths.set(color, `${paths.get(color) ?? ""}M${x} ${y}h${end - x}v1h${x - end}z`)
            x = end
        }
    })

    return (
        <svg
            viewBox={`0 0 ${width} ${grid.length}`}
            width={width * pixel}
            height={grid.length * pixel}
            shapeRendering="crispEdges"
            style={{ display: "block" }}
        >
            {[...paths].map(([color, d]) => (
                <path key={color} d={d} fill={color} />
            ))}
        </svg>
    )
}
