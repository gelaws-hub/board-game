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

            // Only non-sensitive global events
            connection.on("AvailableGamesUpdated", (games) => {
                setAvailableGames(games);
                addMessage("AvailableGamesUpdated", games);
            });

            connection.on("ReceiveMessage", (username, message) => {
                addMessage("ReceiveMessage", { username, message });
            });

            connection.on("GameCreated", (game) => {
                addMessage("GameCreated", game);
            });

            connection.on("PlayerJoined", (username) => {
                addMessage("PlayerJoined", { username });
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
