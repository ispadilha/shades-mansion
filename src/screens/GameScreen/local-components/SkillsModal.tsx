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
    const { t } = useLanguage()

    const skill = character ? skillFor(character.type) : null

    return (
        <ModalCard open={open && character !== null} onClose={onClose} width={340}>
            {character && skill && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {t("skills")}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <CharacterIcon color={character.color} type={character.type} level={character.level} size={72} />
                            <Typography sx={{ fontSize: 12, color: palette.surface.textMuted, mt: 0.5 }}>
                                {character.id}
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
