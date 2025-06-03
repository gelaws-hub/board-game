import {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    useCallback,
} from 'react';
import * as signalR from '@microsoft/signalr';

const BASE_URL = import.meta.env.VITE_POKERCORE;

const SignalRContext = createContext(null);

export const useSignalR = () => {
    const context = useContext(SignalRContext);
    if (!context) {
        throw new Error('useSignalR must be used within a SignalRProvider');
    }
    return context;
};

export const SignalRProvider = ({ children }) => {
    const connectionRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState([]);
    const [availableGames, setAvailableGames] = useState([]);

    const addMessage = useCallback((eventType, data) => {
        const timestamp = new Date().toLocaleTimeString();
        setMessages((prev) => [
            ...prev,
            { timestamp, eventType, data: JSON.stringify(data, null, 2) },
        ]);
    }, []);

    const startConnection = useCallback(async () => {
        if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
            console.log("Connection already established.");
            setIsConnected(true);
            return;
        }

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(`${BASE_URL}/gamehub`)
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    if (retryContext.elapsedMilliseconds < 60000) {
                        return Math.random() * 10000;
                    }
                    return null;
                }
            })
            .configureLogging(signalR.LogLevel.Information)
            .build();

        connectionRef.current = connection;

        connection.onreconnecting((error) => {
            console.warn("Connection reconnecting...", error);
            setIsConnected(false);
            addMessage("Reconnecting", "Attempting to reconnect...", true);
        });

        connection.onreconnected((connectionId) => {
            console.info("Connection reconnected with ID:", connectionId);
            setIsConnected(true);
            addMessage("Reconnected", `Connection ID: ${connectionId}`, true);
        });

        connection.onclose((error) => {
            console.error("Connection closed:", error);
            setIsConnected(false);
            addMessage("Closed", "Connection closed. Attempting to restart...", true);
        });

        connection.on("AvailableGamesUpdated", (games) => {
            console.log("AvailableGamesUpdated received:", games);
            setAvailableGames(games);
            addMessage("AvailableGamesUpdated", games);
        });


        try {
            await connection.start();
            console.log("SignalR Connected!");
            setIsConnected(true);
            addMessage("Connected", "Successfully connected to SignalR Hub.");
            await connection.invoke("BroadcastGameList");
        } catch (err) {
            console.error("SignalR Connection Error: ", err);
            setIsConnected(false);
            addMessage("Error", `Connection failed: ${err.message}`);
            setTimeout(startConnection, 5000);
        }
    }, [addMessage]);

    const invokeHubMethod = useCallback(async (methodName, ...args) => {
        if (connectionRef.current && connectionRef.current.state === signalR.HubConnectionState.Connected) {
            try {
                const result = await connectionRef.current.invoke(methodName, ...args);
                addMessage("Invoke Success", `Method '${methodName}' invoked. Result: ${JSON.stringify(result)}`);
                return result;
            } catch (err) {
                console.error(`Error invoking ${methodName}:`, err);
                addMessage("Invoke Error", `Error invoking ${methodName}: ${err.message}`);
                throw err;
            }
        } else {
            const errorMsg = "SignalR connection not established.";
            console.warn(errorMsg);
            addMessage("Invoke Error", errorMsg);
            throw new Error(errorMsg);
        }
    }, [addMessage]);

    useEffect(() => {
        startConnection();

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
                console.log("SignalR Disconnected on unmount.");
            }
        };
    }, [startConnection]);

    const contextValue = {
        connection: connectionRef.current,
        isConnected,
        messages,
        availableGames,
        invokeHubMethod,
        addMessage,
    };

    return (
        <SignalRContext.Provider value={contextValue}>
            {children}
        </SignalRContext.Provider>
    );
};