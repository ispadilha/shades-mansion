import { BrowserRouter } from "react-router-dom"
import { Providers } from "./Providers"
import { Routes } from "./Routes"

export default function App() {
    return (
        <BrowserRouter>
            <Providers>
                <Routes />
            </Providers>
        </BrowserRouter>
    )
}
