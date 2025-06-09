"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSignalR } from "../context/SignalRContext"

const GameTable = ({ games }) => {
  const [filter, setFilter] = useState("all")
  const navigate = useNavigate()
  const { invokeHubMethod, username, addMessage } = useSignalR()

  const filteredGames = games.filter((game) => {
    if (filter === "all") return true
    return game.gameState === filter
  })

  const getStateColor = (state) => {
    switch (state) {
      case "WaitingForPlayers":
        return "bg-yellow-100 text-yellow-800"
      case "InProgress":
        return "bg-green-100 text-green-800"
      case "Finished":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleJoinGame = async (gameId) => {
    try {
      await invokeHubMethod("JoinGame", gameId, username)
      navigate(`/game/${gameId}`)
    } catch (error) {
      addMessage("Join Game Error", error.message)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-800 to-green-900 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Available Games</h2>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Games" },
            { key: "WaitingForPlayers", label: "Waiting" },
            { key: "InProgress", label: "In Progress" },
            { key: "Finished", label: "Finished" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key ? "bg-white text-green-800" : "bg-green-700 text-white hover:bg-green-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Game Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Players
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGames.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="text-4xl mb-2">🎲</div>
                    <p>No games found</p>
                    <p className="text-sm">Create a new game to get started!</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredGames.map((game) => (
                <tr key={game.gameId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{game.gameName}</div>
                    <div className="text-sm text-gray-500">ID: {game.gameId.slice(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                        {game.gameLeader.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{game.gameLeader}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{game.playerCount}/4</div>
                      <div className="ml-2 flex -space-x-1">
                        {Array.from({ length: Math.min(game.playerCount, 4) }).map((_, i) => (
                          <div key={i} className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white" />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(game.gameState)}`}
                    >
                      {game.gameState}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {game.gameState === "WaitingForPlayers" ? (
                      <button
                        onClick={() => handleJoinGame(game.gameId)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Join Game
                      </button>
                    ) : game.gameState === "InProgress" ? (
                      <button
                        onClick={() => handleJoinGame(game.gameId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Spectate
                      </button>
                    ) : (
                      <span className="text-gray-400">Finished</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GameTable
