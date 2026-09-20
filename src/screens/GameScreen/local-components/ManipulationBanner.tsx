import React from "react"
import { HudBanner } from "./HudBanner"
import type { MotivationItemKey } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface ManipulationBannerProps {
    itemKey: MotivationItemKey | null
    onCancel: () => void
}

export const ManipulationBanner: React.FC<ManipulationBannerProps> = ({ itemKey, onCancel }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <HudBanner
            open={itemKey !== null}
            bg={palette.manipulation.bandBg}
            outline={palette.manipulation.bandOutline}
            textColor={palette.manipulation.bandText}
            message={itemKey ? `${t("manipulatingPiece")}: ${itemKey}` : ""}
            actionLabel={t("cancelManipulation")}
            onAction={onCancel}
        />
    )
}
