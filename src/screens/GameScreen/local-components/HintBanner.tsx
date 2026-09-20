import React from "react"
import { HudBanner } from "./HudBanner"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface HintBannerProps {
    open: boolean
    onDismiss: () => void
}

export const HintBanner: React.FC<HintBannerProps> = ({ open, onDismiss }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <HudBanner
            open={open}
            bg={palette.hud.bandBg}
            outline={palette.hud.bandBorder}
            textColor={palette.hud.logText}
            message={t("hintSelectPiece")}
            actionLabel={t("gotIt")}
            onAction={onDismiss}
        />
    )
}
