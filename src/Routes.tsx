import React from "react"
import { Route, Routes as ReactRoutes, Navigate } from "react-router-dom"
import {
    CharacterScreen,
    CharactersScreen,
    ChooseSideScreen,
    EndScreen,
    GameScreen,
    HomeScreen,
    InitiativeScreen,
    LibraryScreen,
    OptionsScreen,
    RuleScreen,
    RulesScreen,
} from "./screens"

export const Routes: React.FC = () => {
    return (
        <ReactRoutes>
            <Route path="/" element={<HomeScreen />} />

            <Route path="/library" element={<LibraryScreen />} />
            <Route path="/library/characters" element={<CharactersScreen />} />
            <Route path="/library/characters/:characterKey" element={<CharacterScreen />} />
            <Route path="/library/rules" element={<RulesScreen />} />
            <Route path="/library/rules/:ruleKey" element={<RuleScreen />} />

            <Route path="/options" element={<OptionsScreen />} />
            <Route path="/choose-side" element={<ChooseSideScreen />} />
            <Route path="/initiative" element={<InitiativeScreen />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/end" element={<EndScreen />} />

            <Route path="*" element={<Navigate to="/" />} />
        </ReactRoutes>
    )
}
