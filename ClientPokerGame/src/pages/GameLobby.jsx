"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useSignalR } from "../context/SignalRContext"
import NameInputModal from "../components/NameInputModal"
import { faker } from "@faker-js/faker"

function GameLobby() {
  const navigate = useNavigate()
  const [showNameModal, setShowNameModal] = useState(false)
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [editName, setEditName] = useState("")
  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [newGameName, setNewGameName] = useState("")
  const [activeFilter, setActiveFilter] = useState("WaitingForPlayers")

  const { isConnected, invokeHubMethod, messages, addMessage, availableGames, username, updateUsername } = useSignalR()

  useEffect(() => {
    if (!username) {
      setShowNameModal(true)
    }
  }, [username])

  const handleNameSubmit = (name) => {
    updateUsername(name)
    setShowNameModal(false)
  }

  const handleNameChange = () => {
    if (editName.trim()) {
      updateUsername(editName.trim())
      setShowNameEdit(false)
      setEditName("")
    }
  }

  const generateRandomName = () => {
    setEditName(faker.person.firstName())
  }

  const handleCreateGame = async () => {
    if (!isConnected || !username) {
      addMessage("Create Game Error", "Not connected or no username set.")
      return
    }

    setIsCreatingGame(true)
    try {
      const gameName = newGameName.trim() || `${username}'s Game`
      const newGame = await invokeHubMethod("CreateGame", username, gameName)
      addMessage("Hub Invoke: Game Created", newGame)
      navigate(`/game/?room=${newGame.id}`)
    } catch (e) {
      addMessage("Hub Invoke Error: Create Game", { error: e.message })
    } finally {
      setIsCreatingGame(false)
      setNewGameName("")
    }
  }

  const handleJoinGame = async (gameId) => {
    try {
      await invokeHubMethod("JoinGame", gameId, username)
      navigate(`/game/?room=${gameId}`)
    } catch (error) {
      addMessage("Join Game Error", error.message)
    }
  }

  const filteredGames = availableGames.filter((game) => {
    return game.gameState === activeFilter
  })

  const getStatusColor = (state) => {
    switch (state) {
      case "WaitingForPlayers":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
      case "InProgress":
        return "bg-green-500/20 text-green-400 border border-green-500/30"
      case "Finished":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"
    }
  }

  const getStatusText = (state) => {
    switch (state) {
      case "WaitingForPlayers":
        return "Waiting"
      case "InProgress":
        return "In Progress"
      case "Finished":
        return "Finished"
      default:
        return state
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <NameInputModal isOpen={showNameModal} onSubmit={handleNameSubmit} />

      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-lg sm:text-xl"><img src="/poker-icon-96px.png" /></span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">Game Lobby</h1>
                <p className="text-gray-400 text-xs sm:text-sm">{isConnected ? "🟢 Connected" : "🔴 Disconnected"}
                  {isConnected ? (<></>) : (<span className="text-gray-400 text-xs sm:text-sm">  |  Pls wait a few minutes as the backend server is booting up (coldstart) - refresh the browser if needed</span>)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 flex-1 sm:flex-none">
                <span className="text-gray-300 text-sm sm:text-base">Playing as:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold text-sm sm:text-base truncate max-w-24 sm:max-w-none">
                    {username}
                  </span>
                  <button
                    onClick={() => {
                      setEditName(username)
                      setShowNameEdit(true)
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Create Game Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Create New Game</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="Game name (optional)"
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <button
              onClick={handleCreateGame}
              disabled={!isConnected || isCreatingGame || !username}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isCreatingGame ? "Creating..." : "Create Game"}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          {["WaitingForPlayers", "InProgress", "Finished"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                activeFilter === filter ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {filter === "WaitingForPlayers" ? "Waiting" : filter === "InProgress" ? "In Progress" : "Finished"}
            </button>
          ))}
        </div>

        {/* Games Table */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-300">
                    Game
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-300 hidden sm:table-cell">
                    Host
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-300">
                    Players
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-300">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredGames.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-400 text-sm sm:text-base"
                    >
                      No games found for the selected filter
                    </td>
                  </tr>
                ) : (
                  filteredGames.map((game) => (
                    <tr key={game.gameId} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <div className="text-white font-medium text-sm sm:text-base truncate max-w-32 sm:max-w-none">
                          {game.gameName || `Game ${game.gameId.slice(0, 8)}`}
                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">{game.gameId.slice(0, 8)}...</div>
                        {/* Show host on mobile */}
                        <div className="text-gray-400 text-xs sm:hidden mt-1">Host: {game.gameLeader}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs sm:text-sm">
                            {game.gameLeader?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white text-sm sm:text-base">{game.gameLeader}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span className="text-white text-sm sm:text-base">{game.playerCount}/4</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(game.gameState)}`}
                        >
                          {getStatusText(game.gameState)}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4">
                        {game.gameState === "WaitingForPlayers" ? (
                          <button
                            onClick={() => handleJoinGame(game.gameId)}
                            disabled={!isConnected || !username}
                            className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                          >
                            Join
                          </button>
                        ) : game.gameState === "InProgress" ? (
                          <button
                            onClick={() => handleJoinGame(game.gameId)}
                            disabled={!isConnected || !username}
                            className="px-3 sm:px-4 py-1 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                          >
                            Watch
                          </button>
                        ) : (
                          <span className="text-gray-500 text-xs sm:text-sm">Finished</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Debug Messages (collapsible) */}
        <details className="mt-6 sm:mt-8">
          <summary className="bg-gray-800/50 backdrop-blur-sm text-white p-3 sm:p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors border border-gray-700 text-sm sm:text-base">
            Debug Messages ({messages.length})
          </summary>
          <div className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-b-lg max-h-48 sm:max-h-64 overflow-y-auto border border-gray-700 border-t-0">
            <div className="space-y-1 text-xs sm:text-sm font-mono">
              {messages.slice(-20).map((msg, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-gray-500">[{msg.timestamp}]</span>
                  <span className="text-yellow-400">{msg.eventType}:</span>
                  <span className="text-green-400 break-all">
                    {typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data, null, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>

      {/* Change Name Modal */}
      {showNameEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-yellow-600 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="text-3xl sm:text-4xl mb-4">✏️</div>
              <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2">Change Your Name</h3>
              <p className="text-gray-300 text-sm sm:text-base">Update your display name</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none text-sm sm:text-base"
                    placeholder="Enter new name"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateRandomName}
                    className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    title="Generate new name"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleNameChange}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowNameEdit(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">Your name will be updated for all future games</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameLobby
