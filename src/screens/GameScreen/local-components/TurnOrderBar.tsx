import React from "react"
import { Box, Typography } from "@mui/material"
import { CharacterIcon } from "../../../components/characters"
import type { CharacterAuras, CharacterDefinition } from "../../../logic/types"
import { isSpent } from "../../../logic/turn"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"
import { CHARACTER_ICON_SCALE } from "../../../constants/rules"

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
    const { t, tCharacterName } = useLanguage()

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
                            title={tCharacterName(character.id)}
                            onClick={clickable ? onActivate : undefined}
                            sx={{ flexShrink: 0, cursor: clickable ? "pointer" : "default" }}
                        >
                            <CharacterIcon
                                color={character.color}
                                type={character.type}
                                level={character.level}
                                scale={CHARACTER_ICON_SCALE.turnOrder}
                                aura={aura}
                                dimmed={isSpent(character) && !aura}
                            />
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
