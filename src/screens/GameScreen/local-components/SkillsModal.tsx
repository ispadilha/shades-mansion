import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { SkillRow } from "./SkillRow"
import { ModalCard } from "../../../components/ui"
import { CharacterIcon } from "../../../components/characters"
import type { CharacterDefinition } from "../../../logic/types"
import type { Skill } from "../../../logic/skills"
import { skillFor } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"
import { CHARACTER_ICON_SCALE } from "../../../constants/rules"

interface SkillsModalProps {
    open: boolean
    onClose: () => void
    // Personagem de quem são as habilidades: a da vez, já selecionada quando o modal abre
    character: CharacterDefinition | null
    disabled: boolean
    onUse: (skill: Skill) => void
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ open, onClose, character, disabled, onUse }) => {
    const palette = usePalette()
    const { t, tCharacterName } = useLanguage()

    const skill = character ? skillFor(character.type) : null

    return (
        <ModalCard open={open && character !== null} onClose={onClose} width={340}>
            {character && skill && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {t("skills")}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {/* Largura fixa: nome comprido quebra em duas linhas, sem empurrar a habilidade */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                flexShrink: 0,
                                width: 88,
                            }}
                        >
                            <CharacterIcon
                                color={character.color}
                                type={character.type}
                                scale={CHARACTER_ICON_SCALE.skills}
                                level={character.level}
                            />
                            <Typography
                                sx={{ fontSize: 12, color: palette.surface.textMuted, mt: 0.5, textAlign: "center" }}
                            >
                                {tCharacterName(character.id)}
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <SkillRow skill={skill} disabled={disabled} onUse={() => onUse(skill)} />
                        </Box>
                    </Box>

                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={onClose}>{t("close")}</Button>
                    </Box>
                </>
            )}
        </ModalCard>
    )
}
