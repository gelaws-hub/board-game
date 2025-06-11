import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSignalR } from "../context/SignalRContext"

const GameRoom = () => {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const { isConnected, invokeHubMethod, addMessage } = useSignalR()

    const [gameData, setGameData] = useState(null)
    const [username, setUsername] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [allPlayersReady, setAllPlayersReady] = useState(false)

    // Get username from localStorage
    useEffect(() => {
        const savedUsername = localStorage.getItem("poker_username")
        if (!savedUsername) {
            navigate("/")
            return
        }
        setUsername(savedUsername)
    }, [navigate])

    // Set up SignalR event listeners
    useEffect(() => {
        if (!isConnected || !username || !gameId) return

        const connection = (window).signalRConnection
        if (!connection) return

        let hasJoined = false

        const handleGameStateUpdated = (game) => {
            setGameData(game)
            setIsLoading(false)

            // If game started, navigate to game page
            if (game.state === "InProgress") {
                navigate(`/game/${gameId}`)
            }
        }

        const handlePlayerJoined = (user) => {
            addMessage("Player Joined", `${user.username} joined the room`)
        }

        const handlePlayerReady = (player) => {
            addMessage("Player Ready", `${player.user.username} is ready`)
        }

        const handleIsAllPlayersReady = (ready) => {
            setAllPlayersReady(ready)
            addMessage("Ready Status", ready ? "All players are ready!" : "Waiting for players to be ready")
        }

        const handleError = (errorMessage) => {
            console.error("Room error:", errorMessage)
            setError(errorMessage)
            setIsLoading(false)
            addMessage("Room Error", errorMessage)
        }

        // Add event listeners
        connection.on("GameStateUpdated", handleGameStateUpdated)
        connection.on("PlayerJoined", handlePlayerJoined)
        connection.on("PlayerReady", handlePlayerReady)
        connection.on("IsAllPlayersReady", handleIsAllPlayersReady)
        connection.on("Error", handleError)

        // Join/reconnect to the game
        const joinOrReconnectGame = async () => {
            if (hasJoined) return
            hasJoined = true

            try {
                setIsLoading(true)
                // Try to reconnect first, then join if that fails
                try {
                    await invokeHubMethod("Reconnect", gameId, username)
                    addMessage("Reconnected", `Reconnected to game ${gameId}`)
                } catch (reconnectError) {
                    // If reconnect fails, try to join
                    console.warn("Reconnect failed, joining game:", reconnectError.message)
                    await invokeHubMethod("JoinGame", gameId, username)
                    addMessage("Joined Game", `Joined game ${gameId}`)
                }
            } catch (err) {
                hasJoined = false
                setError(`Failed to join game: ${err.message}`)
                setIsLoading(false)
                addMessage("Join Error", err.message)
            }
        }

        joinOrReconnectGame()

        // Cleanup
        return () => {
            connection.off("GameStateUpdated", handleGameStateUpdated)
            connection.off("PlayerJoined", handlePlayerJoined)
            connection.off("PlayerReady", handlePlayerReady)
            connection.off("IsAllPlayersReady", handleIsAllPlayersReady)
            connection.off("Error", handleError)
        }
    }, [isConnected, gameId, username, navigate, invokeHubMethod, addMessage])

    const handleReady = async () => {
        if (!gameId || !username) return

        try {
            await invokeHubMethod("GetPlayerReady", gameId, username)
            addMessage("Ready", "You are now ready!")
        } catch (error) {
            addMessage("Ready Error", error.message)
        }
    }

    const handleStartGame = async () => {
        if (!gameId || !username) return

        try {
            await invokeHubMethod("StartGame", gameId, username)
            addMessage("Game Starting", "Starting the game...")
        } catch (error) {
            addMessage("Start Error", error.message)
        }
    }

    const handleLeaveRoom = () => {
        navigate("/")
    }

    const isGameLeader = gameData?.gameLeader?.user.username === username
    const currentPlayer = gameData?.players.find(p => p.user.username === username)
    const isPlayerReady = currentPlayer?.isReady || false

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
                <div className="text-white text-2xl">Loading room...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-400 text-2xl mb-4">Error: {error}</div>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg"
                    >
                        Return to Lobby
                    </button>
                </div>
            </div>
        )
    }

    if (!gameData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 flex items-center justify-center">
                <div className="text-white text-2xl">Waiting for room data...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-yellow-600/20 shadow-2xl">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-yellow-400 flex items-center gap-3">
                                <span className="text-5xl">🎰</span>
                                {gameData.name}
                            </h1>
                            <p className="text-gray-300 mt-2">
                                Room ID: <span className="font-mono text-yellow-400">{gameId}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
                                <span className="text-sm text-gray-300">{isConnected ? "Connected" : "Disconnected"}</span>
                            </div>

                            <button
                                onClick={handleLeaveRoom}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                            >
                                Leave Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Game Status */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-yellow-600/20 p-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Waiting for Players</h2>
                            <div className="flex justify-center items-center gap-4 mb-4">
                                <span className="text-gray-300">Players: {gameData.players.length}/4</span>
                                <span className="text-gray-300">•</span>
                                <span className={`${allPlayersReady ? "text-green-400" : "text-yellow-400"}`}>
                                    {allPlayersReady ? "All Ready!" : "Waiting for ready"}
                                </span>
                            </div>

                            {isGameLeader && (
                                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-center gap-2 text-blue-400">
                                        <span className="text-2xl">👑</span>
                                        <span className="font-semibold">You are the Room Leader</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-yellow-600/20 overflow-hidden">
                        <div className="p-6 border-b border-gray-700">
                            <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                                <span>👥</span>
                                Players in Room
                            </h3>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {gameData.players.map((player) => (
                                    <div
                                        key={player.id}
                                        className={`bg-gray-800/50 rounded-lg p-4 border-2 transition-all ${player.isReady ? "border-green-500/50 bg-green-900/20" : "border-gray-600/50"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">
                                                    {player.user.username === gameData.gameLeader?.user.username ? "👑" : "🎮"}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">{player.user.username}</div>
                                                    <div className="text-sm text-gray-400">
                                                        {player.user.username === gameData.gameLeader?.user.username ? "Room Leader" : "Player"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${player.isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${player.isReady ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300"
                                                        }`}
                                                >
                                                    {player.isReady ? "Ready" : "Not Ready"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Empty slots */}
                                {Array.from({ length: 4 - gameData.players.length }).map((_, index) => (
                                    <div
                                        key={`empty-${index}`}
                                        className="bg-gray-800/30 rounded-lg p-4 border-2 border-dashed border-gray-600/50"
                                    >
                                        <div className="flex items-center justify-center h-16 text-gray-500">
                                            <div className="text-center">
                                                <div className="text-2xl mb-1">➕</div>
                                                <div className="text-sm">Waiting for player</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-yellow-600/20 p-6">
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            {!isPlayerReady ? (
                                <button
                                    onClick={handleReady}
                                    disabled={!isConnected}
                                    className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 text-lg"
                                >
                                    🎯 Ready Up!
                                </button>
                            ) : (
                                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 text-center">
                                    <div className="text-green-400 font-semibold flex items-center justify-center gap-2">
                                        <span className="text-2xl">✅</span>
                                        You are ready!
                                    </div>
                                </div>
                            )}

                            {isGameLeader && (
                                <button
                                    onClick={handleStartGame}
                                    disabled={!isConnected || !allPlayersReady || gameData.players.length < 2}
                                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 text-lg"
                                >
                                    🚀 Start Game
                                </button>
                            )}
                        </div>

                        {isGameLeader && !allPlayersReady && (
                            <p className="text-center text-gray-400 text-sm mt-4">
                                Waiting for all players to be ready before you can start the game
                            </p>
                        )}

                        {isGameLeader && gameData.players.length < 2 && (
                            <p className="text-center text-yellow-400 text-sm mt-4">
                                Need at least 2 players to start the game
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GameRoom
