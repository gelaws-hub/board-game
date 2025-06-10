"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import "./App.css"
import { SignalRProvider, useSignalR } from "./context/SignalRContext"
import GameLobby from "./pages/GameLobby"
import Game from "./pages/Game"

// Create a wrapper component to handle reconnection
const AppContent = () => {
  const { isConnected, username, reconnectToGame } = useSignalR()

  useEffect(() => {
    // Check if we need to reconnect to a game on app start
    const attemptReconnection = async () => {
      if (isConnected && username) {
        const currentGameId = localStorage.getItem("current-game-id")
        if (currentGameId) {
          await reconnectToGame(currentGameId)
        }
      }
    }

    attemptReconnection()
  }, [isConnected, username])

  return (
    <Router>
      <Routes>
        <Route path="/game" element={<Game />} />
        <Route path="/" element={<GameLobby />} />
        <Route path="*" element={<div className="flex items-center justify-center h-screen">Redirect to a game</div>} />
      </Routes>
    </Router>
  )
}

export default function App() {
  return (
    <SignalRProvider>
      <AppContent />
    </SignalRProvider>
  )
}
