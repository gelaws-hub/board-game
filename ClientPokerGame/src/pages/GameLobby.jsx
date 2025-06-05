import { useEffect, useState } from "react";
import { useSignalR } from "../context/SignalRContext";
import GameList from "../components/GameList";
import { faker } from '@faker-js/faker';

const API_BASE = `${import.meta.env.VITE_POKERCORE}/game`;

function GameLobby() {
    const dummyName = faker.person.fullName;

    const [gameId, setGameId] = useState("");
    const [username, setUsername] = useState(dummyName);
    const [output, setOutput] = useState("");
    const [message, setMessage] = useState("");
    const [playerId, setPlayerId] = useState("");
    const [playerCards, setPlayerCards] = useState();
    const [selectedCard, setSelectedCard] = useState({ cardSuit: null, cardRank: null });

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
            const newGame = await invokeHubMethod("CreateGame");
            setGameId(newGame.id);
            showOutput(newGame);
            addMessage("Hub Invoke: Game Created", newGame);
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
            console.log("player joined : ",)
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
        const cardToPlay = { suit: Number(cardSuit), rank: Number(cardRank) };
        console.log("card to play : ", cardToPlay)
        try {
            await invokeHubMethod("PlayCard", gameId, playerId, cardToPlay);
            addMessage("Hub Invoke: PlayCard", { gameId, playerId, card: cardToPlay });
        } catch (e) {
            addMessage("Hub Invoke Error: PlayCard", { error: e.message });
        }
    };

    const drawCard = async () => {
        console.log("DrawCard", gameId, playerId)

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
        <div className="container mx-auto mt-10 max-w-4xl px-4">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Minuman Game (React UI)</h1>
                <div className="flex items-center gap-2">
                    <span className="text-gray-600">Connection Status:</span>
                    <span
                        className={`font-bold px-3 py-1 rounded-full text-sm ${isConnected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Game</h2>
                <button
                    onClick={createGame}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                >
                    Create Game (API Call)
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Game</h2>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Game ID"
                            value={gameId}
                            onChange={(e) => setGameId(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <button
                        onClick={joinGame}
                        disabled={!isConnected}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors"
                    >
                        Join Game (Hub Invoke)
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Controls</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                        onClick={startGame}
                        disabled={!isConnected}
                        className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Start Game (Hub Invoke)
                    </button>
                    <button
                        onClick={checkStatus}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Check Game Status (API Call)
                    </button>
                    <button
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        onClick={() => playCard("HEARTS", "ACE")}
                        disabled={!isConnected || !playerId || !gameId}
                    >
                        Play Card (Hub Invoke - Example)
                    </button>
                    <button
                        onClick={drawCard}
                        disabled={!isConnected || !playerId || !gameId}
                        className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Draw Card (Hub Invoke)
                    </button>
                    <button
                        onClick={endTurn}
                        disabled={!isConnected || !playerId || !gameId}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        End Turn (Hub Invoke)
                    </button>
                    {/* <button
                        onClick={setCard}
                        disabled={!isConnected || !playerId || !gameId}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        get cards
                    </button> */}
                    <input
                        type="number"
                        placeholder="pick card"
                        value={selectedCard.cardSuit}
                        onChange={(e) => setSelectedCard(prevCard => ({ ...prevCard, cardSuit: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <input
                        type="number"
                        placeholder="pick card"
                        value={selectedCard.cardRank}
                        onChange={(e) => setSelectedCard(prevCard => ({ ...prevCard, cardRank: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    <button
                        onClick={() => playCard(selectedCard.cardSuit, selectedCard.cardRank)}
                        disabled={!isConnected || !playerId || !gameId}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                        Play Card
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Messages</h2>
                <div className="bg-gray-50 rounded-lg p-4">{renderSignalRMessages()}</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <form onSubmit={sendMessage} className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Chat Section</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            onChange={(e) => setMessage(e.target.value)}
                            value={message}
                            placeholder="Type your message..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!isConnected}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded-lg transition-colors"
                        >
                            Send Chat
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Games</h2>
                <GameList availableGames={availableGames} />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">API Call Output:</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                    {output}
                </pre>
            </div>
        </div>
    );
}

export default GameLobby;