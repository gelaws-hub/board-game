import { useState } from "react";
import { useSignalR } from "../context/SignalRContext";

const API_BASE = `${import.meta.env.VITE_POKERCORE}/game`;

function GameLobby() {
    const [gameId, setGameId] = useState("");
    const [username, setUsername] = useState("");
    const [output, setOutput] = useState("");
    const [message, setMessage] = useState("");
    const [playerId, setPlayerId] = useState("");

    const { isConnected, invokeHubMethod, messages: signalRMessages, addMessage, availableGames } = useSignalR();

    const showOutput = (data) => {
        setOutput(JSON.stringify(data, null, 2));
    };

    const createGame = async () => {
        if (!isConnected) {
            addMessage("Create Game Error", "Not connected to SignalR.");
            return;
        }
        try {
            // ** Invoke the Hub method directly **
            const newGame = await invokeHubMethod("CreateGame");
            setGameId(newGame.id); // Assuming the Game object has an 'id' property
            showOutput(newGame);
            addMessage("Hub Invoke: Game Created", newGame);
            // No need for a separate API call here anymore!
            // The lobby list will be updated via the "AvailableGamesUpdated" event from the backend.
        } catch (e) {
            addMessage("Hub Invoke Error: Create Game", { error: e.message });
        }
    };

    const checkStatus = async () => {
        if (!gameId) {
            alert("Game ID required to check status.");
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/status/${gameId}`);
            const data = await res.json();
            showOutput(data);
            addMessage("API: Game Status", data);
        } catch (e) {
            addMessage("API Error: Check Status", { error: e.message });
        }
    };


    const sendMessage = async (event) => {
        event.preventDefault();
        if (!isConnected) {
            addMessage("Send Error", "Not connected to SignalR.");
            return;
        }
        try {
            await invokeHubMethod("SendMessage", username, message);
            addMessage("Hub Invoke: SendMessage", { username, message });
            setMessage("");
        } catch (err) {
            console.error(err);
        }
    };

    const joinGame = async () => {
        if (!gameId || !username) {
            alert("Game ID & username required.");
            return;
        }
        if (!isConnected) {
            addMessage("Join Error", "Not connected to SignalR.");
            return;
        }
        try {
            const result = await invokeHubMethod("JoinGame", gameId, username);
            addMessage("Hub Invoke: JoinGame", { gameId, username, result });
            if (result && typeof result === 'string') {
                setPlayerId(result);
            } else {
                setPlayerId(username);
            }
        } catch (e) {
            addMessage("Hub Invoke Error: Join Game", { error: e.message });
        }
    };

    const startGame = async () => {
        if (!gameId) {
            alert("Game ID required to start.");
            return;
        }
        if (!isConnected) {
            addMessage("Start Error", "Not connected to SignalR.");
            return;
        }
        try {
            await invokeHubMethod("StartGame", gameId);
            addMessage("Hub Invoke: StartGame", { gameId });
        } catch (e) {
            addMessage("Hub Invoke Error: Start Game", { error: e.message });
        }
    };

    const playCard = async (cardSuit, cardRank) => {
        if (!gameId || !playerId || !isConnected) {
            alert("Game ID, Player ID, and connection required to play card.");
            return;
        }
        const cardToPlay = { suit: cardSuit, rank: cardRank };
        try {
            await invokeHubMethod("PlayCard", gameId, playerId, cardToPlay);
            addMessage("Hub Invoke: PlayCard", { gameId, playerId, card: cardToPlay });
        } catch (e) {
            addMessage("Hub Invoke Error: PlayCard", { error: e.message });
        }
    };

    const drawCard = async () => {
        if (!gameId || !playerId || !isConnected) {
            alert("Game ID, Player ID, and connection required to draw card.");
            return;
        }
        try {
            await invokeHubMethod("DrawCard", gameId, playerId);
            addMessage("Hub Invoke: DrawCard", { gameId, playerId });
        } catch (e) {
            addMessage("Hub Invoke Error: DrawCard", { error: e.message });
        }
    };

    const endTurn = async () => {
        if (!gameId || !playerId || !isConnected) {
            alert("Game ID, Player ID, and connection required to end turn.");
            return;
        }
        try {
            await invokeHubMethod("EndTurn", gameId, playerId);
            addMessage("Hub Invoke: EndTurn", { gameId, playerId });
        } catch (e) {
            addMessage("Hub Invoke Error: EndTurn", { error: e.message });
        }
    };

    const renderSignalRMessages = () => {
        return (
            <div className="chat">
                <h3>SignalR Messages:</h3>
                <ul>
                    {signalRMessages.map((msg, i) => (
                        <li key={i} className={msg.isHeartbeat ? "heartbeat" : ""}>
                            <span className="timestamp">[{msg.timestamp}]</span>{" "}
                            <span className="event">{msg.eventType}:</span>{" "}
                            {typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data, null, 2)}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="container">
            <h1>Minuman Game (React UI)</h1>

            <p>
                Connection Status:{" "}
                <span style={{ color: isConnected ? "green" : "red", fontWeight: "bold" }}>
                    {isConnected ? "Connected" : "Disconnected"}
                </span>
            </p>

            <button onClick={createGame}>Create Game (API Call)</button>
            <br />
            <input
                type="text"
                placeholder="Game ID"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
            />
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <button onClick={joinGame} disabled={!isConnected}>Join Game (Hub Invoke)</button>
            <br />
            <button onClick={startGame} disabled={!isConnected}>Start Game (Hub Invoke)</button>
            <br />
            <button onClick={checkStatus}>Check Game Status (API Call)</button>
            <br />
            <button onClick={() => playCard("HEARTS", "ACE")} disabled={!isConnected || !playerId || !gameId}>Play Card (Hub Invoke - Example)</button>
            <button onClick={drawCard} disabled={!isConnected || !playerId || !gameId}>Draw Card (Hub Invoke)</button>
            <button onClick={endTurn} disabled={!isConnected || !playerId || !gameId}>End Turn (Hub Invoke)</button>


            <form onSubmit={sendMessage}>
                <h3>Chat Section</h3>
                <input type="text" onChange={(e) => setMessage(e.target.value)} value={message} />
                <button type="submit" disabled={!isConnected}>Send Chat</button>
            </form>


            <h3>API Call Output:</h3>
            <pre>{output}</pre>

            <div>
                <h3>Available Games (from SignalR Hub)</h3>
                {availableGames.length > 0 ? (
                    <ul>
                        {availableGames.map((game) => (
                            <li key={game.id}>
                                ID: {game.id} | Players: {game.players.length} | State: {game.state}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No games available.</p>
                )}
            </div>

            {renderSignalRMessages()}
        </div>
    );
}

export default GameLobby;