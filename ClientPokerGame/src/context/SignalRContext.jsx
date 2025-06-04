import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

const SignalRContext = createContext();

export function SignalRProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false);
    const [availableGames, setAvailableGames] = useState([]);
    const [messages, setMessages] = useState([]);
    const connectionRef = useRef(null);

    const BASE_URL = import.meta.env.VITE_POKERCORE;

    useEffect(() => {
        const connect = async () => {
            const connection = new signalR.HubConnectionBuilder()
                .withUrl(`${BASE_URL}/gamehub`)
                .withAutomaticReconnect()
                .build();

            connection.on("AvailableGamesUpdated", (games) => {
                setAvailableGames(games);
                addMessage("AvailableGamesUpdated", games);
            });

            connection.on("ReceieveMessage", (username, message) => {
                addMessage("ReceieveMessage", { username, message });
            });

            connection.on("GameCreated", (game) => {
                addMessage("GameCreated", game);
            });

            connection.on("PlayerJoined", (username) => {
                addMessage("PlayerJoined", { username });
            });

            connection.on("GameStateUpdated", (updatedGame) => {
                addMessage("GameStateUpdated", updatedGame);
                console.log("Games Updated: ", updatedGame)

                setAvailableGames((prevGames) => {
                    const gameIndex = prevGames.findIndex(g => g.id === updatedGame.id);
                    if (gameIndex !== -1) {
                        // Update the existing game in the list
                        const updatedGames = [...prevGames];
                        updatedGames[gameIndex] = updatedGame;
                        return updatedGames;
                    } else {
                        // Optionally add it if it's not there
                        return [...prevGames, updatedGame];
                    }
                });
            });


            connection.on("GameStarted", (game) => {
                addMessage("GameStarted", game);
            });

            connection.on("CardDrawn", (playerId, card) => {
                addMessage("CardDrawn", { playerId, card });
            });

            connection.on("Error", (errorMessage) => {
                addMessage("Error", errorMessage);
            });

            connectionRef.current = connection;

            try {
                await connection.start();
                setIsConnected(true);
                addMessage("Connected", "SignalR connection established.");
                await connection.invoke("BroadcastGameList");
            } catch (err) {
                console.error("SignalR Connection Error:", err);
                addMessage("Connection Error", err.message);
            }
        };

        connect();

        return () => {
            connectionRef.current?.stop();
        };
    }, []);

    const invokeHubMethod = async (methodName, ...args) => {
        if (!connectionRef.current || connectionRef.current.state !== "Connected") {
            throw new Error("SignalR not connected");
        }
        return await connectionRef.current.invoke(methodName, ...args);
    };

    const addMessage = (eventType, data) => {
        const timestamp = new Date().toLocaleTimeString();
        setMessages((prev) => [...prev, { eventType, data, timestamp }]);
    };

    return (
        <SignalRContext.Provider
            value={{
                isConnected,
                invokeHubMethod,
                addMessage,
                availableGames,
                messages,
            }}
        >
            {children}
        </SignalRContext.Provider>
    );
}

export const useSignalR = () => useContext(SignalRContext);
