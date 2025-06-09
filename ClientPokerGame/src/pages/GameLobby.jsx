"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSignalR } from "../context/SignalRContext"
import GameTable from "../components/GameTable"
import NameInputModal from "../components/NameInputModal"
import ConnectionStatus from "../components/ConnectionStatus"

function GameLobby() {
  const navigate = useNavigate()
  const [showNameModal, setShowNameModal] = useState(false)
  const [showChangeNameModal, setShowChangeNameModal] = useState(false)
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [newGameName, setNewGameName] = useState("")

  const { isConnected, invokeHubMethod, messages, addMessage, availableGames, username, updateUsername } = useSignalR()

  useEffect(() => {
    if (!username) {
      setShowNameModal(true)
    }
  }, [username])

  const handleNameSubmit = (name) => {
    updateUsername(name)
    setShowNameModal(false)
    setShowChangeNameModal(false)
  }

  const createGame = async () => {
    if (!isConnected || !username) {
      addMessage("Create Game Error", "Not connected or no username set.")
      return
    }

    setIsCreatingGame(true)
    try {
      const gameName = newGameName.trim() || `${username}'s Game`
      const newGame = await invokeHubMethod("CreateGame", username, gameName)
      addMessage("Hub Invoke: Game Created", newGame)
      navigate(`/game/${newGame.id}`)
    } catch (e) {
      addMessage("Hub Invoke Error: Create Game", { error: e.message })
    } finally {
      setIsCreatingGame(false)
      setNewGameName("")
    }
  }

  const refreshGames = async () => {
    if (!isConnected) return
    try {
      await invokeHubMethod("BroadcastGameList")
    } catch (e) {
      addMessage("Refresh Error", e.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900">
      <NameInputModal isOpen={showNameModal} onSubmit={handleNameSubmit} />
      <NameInputModal isOpen={showChangeNameModal} onSubmit={handleNameSubmit} currentName={username} />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">🎲 Poker Game Lobby</h1>
          <div className="flex items-center justify-center gap-4 text-white">
            <ConnectionStatus />
            {username && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span>Welcome, {username}</span>
                <button
                  onClick={() => setShowChangeNameModal(true)}
                  className="text-blue-300 hover:text-blue-100 text-sm underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Game Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Game name (optional)"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createGame}
                disabled={!isConnected || !username || isCreatingGame}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                {isCreatingGame ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>🎮</span>
                    Create Game
                  </>
                )}
              </button>
              <button
                onClick={refreshGames}
                disabled={!isConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Games Table */}
        <GameTable games={availableGames} />

        {/* Debug Messages (collapsible) */}
        <details className="mt-8">
          <summary className="bg-gray-800 text-white p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
            Debug Messages ({messages.length})
          </summary>
          <div className="bg-gray-900 text-green-400 p-4 rounded-b-lg max-h-64 overflow-y-auto">
            <div className="space-y-1 text-sm font-mono">
              {messages.slice(-20).map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500">[{msg.timestamp}]</span>
                  <span className="text-yellow-400">{msg.eventType}:</span>
                  <span className="text-green-400">
                    {typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data, null, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default GameLobby
