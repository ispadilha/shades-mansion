import React from "react"
import { Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import type { Barrier } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface BarrierInfoModalProps {
    barrier: Barrier | null
    onClose: () => void
}

export const BarrierInfoModal: React.FC<BarrierInfoModalProps> = ({ barrier, onClose }) => {
    const palette = usePalette()
    const { t, tTeam } = useLanguage()

    return (
        <ModalCard open={barrier !== null} onClose={onClose} width={280} sx={{ p: 2 }}>
            {barrier && (
                <>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        {t("barrier")}
                    </Typography>
                    <Typography>
                        {t("team")}: {tTeam(barrier.color)}
                    </Typography>
                    <Typography>
                        {t("litBy")}: {barrier.ownerId}
                    </Typography>
                    <Typography sx={{ mt: 1.5, fontSize: 13, color: palette.surface.textMuted }}>
                        {t("barrierDescription")}
                    </Typography>
                </>
            )}
        </ModalCard>
    )
}
