import React from "react"
import { Box, Typography } from "@mui/material"
import { CharacterIcon } from "../../../components/characters"
import type { CharacterAuras, CharacterDefinition } from "../../../logic/types"
import { isSpent } from "../../../logic/turn"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"
import { AURA_PALETTE } from "../../../constants/palette"

interface TurnOrderBarProps {
    // Personagens ainda em jogo, já na ordem de iniciativa
    order: CharacterDefinition[]
    auras: CharacterAuras
    // Personagem da vez: ícone clicável para selecionar e centralizar na câmera
    activeId: string | null
    onActivate?: () => void
    round: number
}

export const TurnOrderBar: React.FC<TurnOrderBarProps> = ({ order, auras, activeId, onActivate, round }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Box sx={{ height: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: 1, px: 2 }}>
            <Typography sx={{ color: palette.initiative.rank, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
                {t("round")} {round}
            </Typography>

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    overflowX: "auto",
                    overflowY: "hidden",
                }}
            >
                {order.map((character) => {
                    const aura = auras[character.id] ?? null
                    const clickable = character.id === activeId && onActivate !== undefined

                    return (
                        <Box
                            key={character.id}
                            onClick={clickable ? onActivate : undefined}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flexShrink: 0,
                                cursor: clickable ? "pointer" : "default",
                            }}
                        >
                            <CharacterIcon
                                color={character.color}
                                type={character.type}
                                level={character.level}
                                size={34}
                                aura={aura}
                                dimmed={isSpent(character) && !aura}
                            />
                            <Typography sx={{ color: aura ? AURA_PALETTE[aura].color : palette.initiative.idleId, fontSize: 10 }}>
                                {character.id}
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
