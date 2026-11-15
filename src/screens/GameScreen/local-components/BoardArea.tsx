import React, { type RefObject } from "react"
import { Box } from "@mui/material"
import { Board, type BoardProps } from "../../../components/board"
import { BOARD_OVERFLOW, CELL_SIZE } from "../../../constants/rules"

interface BoardAreaProps extends Omit<BoardProps, "cellSize"> {
    // A viewport rolável: a câmera da partida mexe nela
    scrollRef: RefObject<HTMLDivElement | null>
}

// A área do tabuleiro: um labirinto inteiro é maior que a janela, então ele mora dentro
// de uma viewport que rola, centralizado enquanto couber. O resto das props é o tabuleiro em si.
export const BoardArea: React.FC<BoardAreaProps> = ({ scrollRef, ...board }) => {
    return (
        <Box ref={scrollRef} sx={{ flex: 1, overflow: "auto", position: "relative", overscrollBehavior: "none" }}>
            <Box
                sx={{
                    width: "fit-content",
                    minWidth: "100%",
                    minHeight: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // A folga em volta do tabuleiro é o quanto a cena passa da borda dele
                    p: `${CELL_SIZE * BOARD_OVERFLOW}px`,
                    boxSizing: "border-box",
                }}
            >
                <Board cellSize={CELL_SIZE} {...board} />
            </Box>
        </Box>
    )
}
