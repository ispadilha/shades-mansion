import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { SkillRow } from "./SkillRow"
import { ModalCard } from "../../../components/ui"
import { PieceToken } from "../../../components/pieces"
import type { PieceDefinition } from "../../../logic/types"
import type { Skill } from "../../../logic/skills"
import { skillFor } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillsModalProps {
    open: boolean
    onClose: () => void
    // Peça de quem são as habilidades: a da vez, já selecionada quando o modal abre
    piece: PieceDefinition | null
    disabled: boolean
    onUse: (skill: Skill) => void
}

export const SkillsModal: React.FC<SkillsModalProps> = ({ open, onClose, piece, disabled, onUse }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    const skill = piece ? skillFor(piece.type) : null

    return (
        <ModalCard open={open && piece !== null} onClose={onClose} width={340}>
            {piece && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {t("skills")}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <PieceToken color={piece.color} type={piece.type} size={72} />
                            <Typography sx={{ fontSize: 12, color: palette.surface.textMuted, mt: 0.5 }}>
                                {piece.id}
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <SkillRow skill={skill} disabled={disabled} onUse={() => skill && onUse(skill)} />
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
