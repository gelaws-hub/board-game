"use client"

import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { useSignalR } from "../context/SignalRContext"
import GameBoard from "../components/GameBoard"
import PlayerHand from "../components/PlayerHand"
import OpponentHand from "../components/OpponentHand"
import RemainingDeck from "../components/RemainingDeck"
import TurnToast from "../components/TurnToast"

const Game = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const gameId = searchParams.get('room');

    const navigate = useNavigate()

    const {
        isConnected,
        invokeHubMethod,
        currentGame,
        personalGameView,
        username,
        chat,
        addMessage,
        setCurrentGame,
        setPersonalGameView,
        reconnecting,
        reconnectToGame,
    } = useSignalR()

    const [chatMessage, setChatMessage] = useState("")
    const [showChat, setShowChat] = useState(false)
    const [actionInProgress, setActionInProgress] = useState(false)


    useEffect(() => {
        if (!username) {
            navigate("/")
            return
        }

        // Store current game ID in localStorage for reconnection
        if (gameId) {
            localStorage.setItem("current-game-id", gameId)
        }

        // Join the game group when component mounts
        const joinGameGroup = async () => {
            try {
                if (!isConnected) {
                    addMessage("Connection Status", "Waiting for connection before joining game...")
                    return
                }

                // Try to reconnect first if we were previously in this game
                const reconnected = await reconnectToGame(gameId)

                // If reconnection failed or wasn't needed, join normally
                if (!reconnected) {
                    await invokeHubMethod("JoinGame", gameId, username)
                }
            } catch (error) {
                console.error("Failed to join game:", error)
                addMessage("Join Error", error.message)
            }
        }

        if (isConnected && gameId) {
            joinGameGroup()
        }

        // Cleanup when leaving
        return () => {
            setCurrentGame(null)
            setPersonalGameView(null)
            localStorage.removeItem("current-game-id")
        }
    }, [gameId, username, isConnected])

    const handleReady = async () => {
        try {
            setActionInProgress(true)
            await invokeHubMethod("GetPlayerReady", gameId, username)
        } catch (error) {
            addMessage("Ready Error", error.message)
        } finally {
            setActionInProgress(false)
        }
    }

    const handleStartGame = async () => {
        try {
            setActionInProgress(true)
            await invokeHubMethod("StartGame", gameId, username, 5)
        } catch (error) {
            addMessage("Start Game Error", error.message)
        } finally {
            setActionInProgress(false)
        }
    }

    const handlePlayCard = async (card) => {
        try {
            setActionInProgress(true)
            await invokeHubMethod("PlayCard", gameId, username, card.suit, card.rank)
        } catch (error) {
            addMessage("Play Card Error", error.message)
        } finally {
            setActionInProgress(false)
        }
    }

    const handleDrawCard = async () => {
        try {
            setActionInProgress(true)
            await invokeHubMethod("DrawCard", gameId, username)
        } catch (error) {
            addMessage("Draw Card Error", error.message)
        } finally {
            setActionInProgress(false)
        }
    }

    const handleEndTurn = async () => {
        try {
            setActionInProgress(true)
            await invokeHubMethod("EndTurn", gameId, username)
        } catch (error) {
            addMessage("End Turn Error", error.message)
        } finally {
            setActionInProgress(false)
        }
    }

    const sendChatMessage = async (e) => {
        e.preventDefault()
        if (!chatMessage.trim()) return

        try {
            await invokeHubMethod("SendMessage", gameId, username, chatMessage)
            setChatMessage("")
        } catch (error) {
            addMessage("Chat Error", error.message)
        }
    }

    // Use personalGameView if available, otherwise fall back to currentGame
    const gameData = personalGameView

    if (!gameData) {
        return (
            <div className="h-screen w-screen bg-green-800 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="text-4xl mb-4">🎲</div>
                    <div className="text-xl mb-2">{reconnecting ? "Reconnecting to game..." : "Loading game..."}</div>
                    <div className="text-xs opacity-75">Game ID: {gameId}</div>
                    <div className="text-xs opacity-75 mt-4">
                        If loading takes too long, there is a chance you are no longer connected.
                    </div>
                    <button
                        onClick={() => navigate("/") || window.location.reload()}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Go to Lobby
                    </button>

                    {!isConnected && (
                        <div className="text-red-300 mt-4">
                            {reconnecting ? "Attempting to reconnect..." : "Not connected to server"}
                        </div>
                    )}
                    {reconnecting && (
                        <div className="mt-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const isGameLeader = personalGameView?.gameLeader?.user?.username === username
    const currentPlayer = personalGameView.playerInfo
    const isMyTurn = personalGameView.currentPlayer?.user?.username === username

    console.log("Game Data:", gameData)
    console.log("Game leader : ", gameData.gameLeader)

    // Render waiting for players
    if (gameData.state === "WaitingForPlayers") {
        return (
            <div className="h-screen w-screen bg-green-800 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                    <h2 className="text-2xl font-bold mb-4">Waiting for Players</h2>
                    <div className="mb-6">
                        <div className="text-sm text-gray-600 mb-4">Game ID: {gameId}</div>
                        <div className="text-md text-gray-800 mb-4">Game Name: {gameData.name}</div>
                        <div className="space-y-2">
                            {(gameData?.players || []).map((player) => (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {player.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <span>{player.user.username}</span>
                                        {gameData?.gameLeader?.id === player.id && (
                                            <span className="text-xs bg-yellow-200 px-2 py-1 rounded">Host</span>
                                        )}
                                    </div>
                                    <div
                                        className={`text-xs px-2 py-1 rounded ${player.isReady ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                                            }`}
                                    >
                                        {player.isReady ? "Ready" : "Not Ready"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {!currentPlayer?.isReady && (
                            <button
                                onClick={handleReady}
                                disabled={!isConnected || actionInProgress}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                {actionInProgress ? "Processing..." : "Ready Up"}
                            </button>
                        )}

                        {isGameLeader && gameData?.isAllPlayersReady && (
                            <button
                                onClick={handleStartGame}
                                disabled={!isConnected || actionInProgress}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-lg transition-colors"
                            >
                                {actionInProgress ? "Starting..." : "Start Game"}
                            </button>
                        )}

                        <button
                            onClick={() => navigate("/") || window.location.reload()}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (gameData.gameState === "Finished" || gameData.state === "Finished") {
        return (
            <div className="h-screen w-screen bg-green-800 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                    <h2 className="text-3xl font-bold mb-4">🎉 Game Over!</h2>
                    {gameData?.gameWinner && (
                        <div className="mb-6">
                            <div className="text-lg mb-2">Winner:</div>
                            <div className="text-2xl font-bold text-green-600">{gameData.gameWinner.user.username}</div>
                        </div>
                    )}
                    <button
                        onClick={() => navigate("/") || window.location.reload()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                    >
                        Back to Lobby
                    </button>
                </div>
            </div>
        )
    }

    // In Progress game state
    const playerHand = personalGameView?.playerInfo?.hand || []
    const opponents = personalGameView?.opponents || []
    const boardHistory = personalGameView?.boardHistory || []
    const currentSubRoundCards = personalGameView?.currentSubRoundCards || []
    const remainingCards = personalGameView?.minumPile?.count || 0

    console.log("Current Player : ", personalGameView?.currentPlayer.user);

    return (
        <div className="h-screen w-screen bg-green-800 overflow-hidden relative">
            <TurnToast playerUsername={username} currentUsername={gameData?.currentPlayer?.user?.username} />
            <div className="absolute bottom-2 left-2 text-white/70 text-xs">Game ID: {gameId}</div>

            {/* Chat toggle */}
            <button
                onClick={() => setShowChat(!showChat)}
                className="absolute top-10 right-4 bg-blue-600/80 hover:bg-blue-700/80 text-white px-4 py-2 rounded-lg z-10"
            >
                💬 Chat
            </button>

            {/* Chat panel */}
            {showChat && (
                <div className="absolute top-16 right-4 w-80 bg-green-100/80 rounded-lg shadow-lg z-10">
                    <div className="p-4 border-b flex items-center">
                        <h3 className="font-bold">Game Chat</h3>
                        <button
                            onClick={() => setShowChat(false)}
                            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white px-4 py-1 h-fit rounded-lg text-sm"
                        >
                            Close
                        </button>
                    </div>
                    <div className="h-[50vh] overflow-y-auto p-4 text-sm">
                        {chat?.map((chat, index) => (
                            <div className={`bg-green-50/70 rounded-lg p-2 mb-2 ${chat.data.username === username ? "ml-4 rounded-br-none" : "mr-4 rounded-tl-none"}`}>
                                <div key={index} className={`text-sm`}>
                                    <strong>{chat.data.username === username ? "You" : chat.data.username} :</strong> {chat.data.message}
                                </div>
                                <div className="text-xs text-gray-500 text-right">{chat.timestamp}</div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={sendChatMessage} className="px-4 py-2 border-t flex items-center">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Type a message..."
                                style={{ marginBottom: 0 }}
                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 h-fit py-2 rounded-lg text-sm">
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-green-900 p-1 text-green-100">
                <h2 className="text-center">
                    Turn: {personalGameView?.currentPlayer?.user?.username || "Loading..."}
                    {isMyTurn && <span className="ml-2 text-yellow-300">← Your Turn!</span>}
                </h2>
            </div>

            {/* Opponents */}
            {opponents.map((opponent, index) => {
                const positions = opponents.length === 1 ? ["top"] : ["left", "top", "right"]
                const position = positions[index % positions.length]

                return (
                    <div
                        key={opponent.playerId}
                        className={`absolute ${position === "left"
                            ? "-left-10 top-1/2 transform -translate-y-1/2 rotate-90"
                            : position === "top"
                                ? "top-10 left-1/2 transform -translate-x-1/2"
                                : "-right-10 top-1/2 transform -translate-y-1/2 rotate-90"
                            }`}
                    >
                        <OpponentHand position={position} count={opponent.remainingCardNum} />
                        <p
                            className={`absolute bg-black bg-opacity-50 text-white px-2 py-2 rounded-full text-xs text-center ${position === "top" ? "" : "-rotate-90 bottom-7 -right-16"
                                }`}
                        >
                            {opponent.username}
                            {!opponent.isConnected && <span className="text-red-300"> (DC)</span>}
                        </p>
                    </div>
                )
            })}

            {/* Game board in the center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <GameBoard boardHistory={boardHistory} currentSubRoundCards={currentSubRoundCards} />
            </div>

            {/* Remaining deck */}
            <div className="absolute bottom-[15%] right-[10%] md:bottom-[15%] md:right-[15%] transform -translate-y-1/2">
                <RemainingDeck count={remainingCards} onDrawCard={isMyTurn ? handleDrawCard : null} />
            </div>

            {/* End Turn button */}
            {isMyTurn && (
                <div className={`absolute bottom-40 left-1/2 transform -translate-x-1/2`}>
                    <button
                        onClick={handleEndTurn}
                        disabled={actionInProgress}
                        className={`bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-2 rounded-lg transition-colors ${remainingCards > 0 ? "hidden" : ""}`}
                    >
                        {actionInProgress ? "Processing..." : "End Turn"}
                    </button>
                </div>
            )}

            {/* Player's hand at the bottom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <PlayerHand hand={playerHand} onCardClick={handlePlayCard} toPlay={isMyTurn && !actionInProgress} />
            </div>
        </div>
    )
}

export default Game
