"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import * as signalR from "@microsoft/signalr"

const SignalRContext = createContext()

export function SignalRProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  const [availableGames, setAvailableGames] = useState([])
  const [messages, setMessages] = useState([])
  const [chat, setChat] = useState([])
  const [currentGame, setCurrentGame] = useState(null)
  const [personalGameView, setPersonalGameView] = useState(null)
  const [username, setUsername] = useState(() => localStorage.getItem("poker-username") || "")
  const connectionRef = useRef(null)
  const [reconnecting, setReconnecting] = useState(false)

  // removed because it's now built at the same time with the backend
  // const BASE_URL = import.meta.env.VITE_POKERCORE

  useEffect(() => {
    if (!username) return // Don't connect without username

    const connect = async () => {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`/gamehub`)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // More aggressive reconnection strategy
        .build()

      // Add connection state change handler
      connection.onreconnecting((error) => {
        setIsConnected(false)
        addMessage("Reconnecting", `Connection lost. Attempting to reconnect: ${error?.message || "Unknown error"}`)
      })

      connection.onreconnected((connectionId) => {
        setIsConnected(true)
        addMessage("Reconnected", `Connection reestablished. ID: ${connectionId}`)

        // Try to reconnect to current game if we have one
        const currentGameId = localStorage.getItem("current-game-id")
        if (currentGameId) {
          reconnectToGame(currentGameId)
        }
      })

      // Global events
      connection.on("AvailableGamesUpdated", (games) => {
        setAvailableGames(games)
        addMessage("AvailableGamesUpdated", games)
      })

      connection.on("GameCreated", (game) => {
        addMessage("GameCreated", game)
      })

      connection.on("PlayerJoined", (user) => {
        addMessage("PlayerJoined", user)
      })

      connection.on("ReceiveMessage", (username, message) => {
        addMessage("ReceiveMessage", { username, message })
        addChatMessage({ username, message })
      })

      connection.on("Error", (errorMessage) => {
        addMessage("Error", errorMessage)
      })

      // Private events
      connection.on("PersonalGameView", (gameView) => {
        setPersonalGameView(gameView)
        addMessage("PersonalGameView", "Updated")
      })

      connection.on("GameStateUpdated", (game) => {
        setCurrentGame(game)
        addMessage("GameStateUpdated", game)
      })

      connection.on("PlayerReady", (player) => {
        addMessage("PlayerReady", player)
      })

      connection.on("CardDrawn", (playerId, card) => {
        addMessage("CardDrawn", { playerId, card })
      })

      connectionRef.current = connection

      try {
        await connection.start()
        setIsConnected(true)
        addMessage("Connected", "SignalR connection established.")
        await connection.invoke("BroadcastGameList")
      } catch (err) {
        console.error("SignalR Connection Error:", err)
        addMessage("Connection Error", err.message)
      }
    }

    connect()

    return () => {
      connectionRef.current?.stop()
    }
  }, [username])

  const invokeHubMethod = async (methodName, ...args) => {
    if (!connectionRef.current || connectionRef.current.state !== "Connected") {
      throw new Error("SignalR not connected")
    }
    return await connectionRef.current.invoke(methodName, ...args)
  }

  const reconnectToGame = async (gameId) => {
    if (!connectionRef.current || !username || !gameId) return false

    try {
      setReconnecting(true)
      await connectionRef.current.invoke("Reconnect", gameId, username)
      addMessage("Reconnected", `Reconnected to game ${gameId}`)
      return true
    } catch (error) {
      addMessage("Reconnection Error", error.message)
      return false
    } finally {
      setReconnecting(false)
    }
  }

  const addMessage = (eventType, data) => {
    const timestamp = new Date().toLocaleTimeString()
    setMessages((prev) => [...prev, { eventType, data, timestamp }])
  }

  const addChatMessage = (data) => {
    const timestamp = new Date().toLocaleTimeString()
    setChat((prev) => [...prev, { data, timestamp }])
  }

  const updateUsername = (newUsername) => {
    setUsername(newUsername)
    localStorage.setItem("poker-username", newUsername)
  }

  return (
    <SignalRContext.Provider
      value={{
        isConnected,
        invokeHubMethod,
        addMessage,
        availableGames,
        messages,
        chat,
        currentGame,
        personalGameView,
        username,
        updateUsername,
        setCurrentGame,
        setPersonalGameView,
        reconnecting,
        reconnectToGame,
      }}
    >
      {children}
    </SignalRContext.Provider>
  )
}

export const useSignalR = () => useContext(SignalRContext)
