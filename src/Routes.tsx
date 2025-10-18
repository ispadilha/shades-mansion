import React from "react"
import { Route, Routes as ReactRoutes, Navigate } from "react-router-dom"
import { HomeScreen } from "./screens/HomeScreen"
import { OptionsScreen } from "./screens/OptionsScreen"
import { ChooseSideScreen } from "./screens/ChooseSideScreen"
import { GameScreen } from "./screens/GameScreen"
import { EndScreen } from "./screens/EndScreen"

export const Routes: React.FC = () => {
    return (
        <ReactRoutes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/options" element={<OptionsScreen />} />
            <Route path="/choose-side" element={<ChooseSideScreen />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/end" element={<EndScreen />} />

            <Route path="*" element={<Navigate to="/" />} />
        </ReactRoutes>
    )
}
