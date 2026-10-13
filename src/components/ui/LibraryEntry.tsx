import React from "react"
import { Box, Typography } from "@mui/material"
import { usePalette } from "../../hooks/usePalette"

interface LibraryEntryProps {
    // As partes do verbete, na ordem em que aparecem. Cada uma pode ter um título acima dela:
    // a regra é uma parte só, sem título, e a ficha de personagem tem várias, com títulos.
    sections: Array<{ title?: string; text: string }>
}

export const LibraryEntry: React.FC<LibraryEntryProps> = ({ sections }) => {
    const palette = usePalette()

    return (
        <Box sx={{ width: 720, maxWidth: "90vw", maxHeight: "60vh", overflowY: "auto" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {sections.map(({ title, text }, index) => (
                    <Box key={index}>
                        {title && (
                            <Typography
                                sx={{
                                    color: palette.ui.accentMuted,
                                    fontSize: 13,
                                    letterSpacing: 1,
                                    textTransform: "uppercase",
                                    mb: 0.5,
                                }}
                            >
                                {title}
                            </Typography>
                        )}
                        <Typography sx={{ color: palette.ui.textBody, fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                            {text}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
