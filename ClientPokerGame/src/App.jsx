import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import "./App.css"
import { SignalRProvider } from "./context/SignalRContext"
import GameLobby from "./pages/GameLobby"
import Game from "./pages/Game"

export default function App() {
  return (
    <SignalRProvider >
      <Router>
        <Routes>
          <Route path="/game/:gameId" element={<Game />} />
          <Route path="/" element={<GameLobby />} />
          <Route path="*" element={<div className="flex items-center justify-center h-screen">Redirect to a game</div>} />
        </Routes>
      </Router>
    </SignalRProvider>
  )
}