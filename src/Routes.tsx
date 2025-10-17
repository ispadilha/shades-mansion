import { Route, Routes as ReactRoutes } from "react-router-dom"
import { HomeScreen } from "./screens/HomeScreen"

interface RoutesProps {}

export const Routes: React.FC<RoutesProps> = ({}) => {

    return (
        <ReactRoutes>
            {/* <Route index element={<HomeScreen />} /> */}
        </ReactRoutes>
    )
}
