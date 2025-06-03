import { useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import "./App.css";

const API_BASE = "http://localhost:5037/game";

function App() {
  const [gameId, setGameId] = useState("");
  const [username, setUsername] = useState("");
  const [output, setOutput] = useState("");
  const [messages, setMessages] = useState([]);
  const connectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState("")

  const addMessage = (eventType, data, isHeartbeat = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const msg = {
      timestamp,
      eventType,
      data: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      isHeartbeat,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const setupConnection = async () => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5037/gamehub")
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on("ReceieveMessage", (username, message) => (
      addMessage("ReceieveMessage", username, message)
    ))

    connection.on("Heartbeat", (message) =>
      addMessage("Heartbeat", message, true)
    );
    connection.on("GameStateUpdated", (game) =>
      addMessage("GameStateUpdated", game)
    );
    connection.on("PlayerJoined", (username) =>
      addMessage("PlayerJoined", username)
    );
    connection.on("AvailableGamesUpdated", (games) =>
      addMessage("AvailableGamesUpdated", games)
    );
    connection.on("Error", (message) =>
      addMessage("Server Error", message)
    );
    connection.on("GameStarted", (game) =>
      addMessage("GameStarted", game)
    );
    connection.on("CardDrawn", (playerId, card) =>
      addMessage("CardDrawn", { playerId, card })
    );

    connection.onreconnecting((error) => {
      addMessage("Reconnecting", { error: error.message });
    });
    connection.onreconnected((connectionId) => {
      addMessage("Reconnected", { connectionId });
    });

    try {
      await connection.start();
      addMessage("Connected", { connectionId: connection.connectionId });
      setIsConnected(true);
    } catch (err) {
      addMessage("Connection Error", { error: err.message });
      setTimeout(setupConnection, 5000);
      setIsConnected(false);
    }

    connectionRef.current = connection;
  };

  const showOutput = (data) => {
    setOutput(JSON.stringify(data, null, 2));
  };

  const createGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/create`, { method: "POST" });
      const data = await res.json();
      setGameId(data.gameId);
      showOutput(data);
      addMessage("API: Game Created", data);
    } catch (e) {
      addMessage("API Error: Create Game", { error: e.message });
    }
  };

  const sendMessage = (event) => {
    connectionRef.current.invoke("SendMessage", username, message).catch(function (err) {
      return console.error(err.toString());
    })
    event.preventDefault();
  }

  const joinGame = async () => {
    if (!gameId || !username) return alert("Game ID & username required.");
    try {
      const res = await fetch(`${API_BASE}/${gameId}/join?username=${username}`, {
        method: "POST",
      });
      const data = await res.json();
      showOutput(data);
      addMessage("API: Player Joined", data);
      await connectionRef.current.invoke("JoinGame", gameId, username);
      addMessage("Hub Invoke: JoinGame", { gameId, username });
    } catch (e) {
      addMessage("API Error: Join Game", { error: e.message });
    }
  };

  const startGame = async () => {
    try {
      const res = await fetch(`${API_BASE}/${gameId}/start`, { method: "POST" });
      const data = await res.json();
      showOutput(data);
      addMessage("API: Game Started", data);
    } catch (e) {
      addMessage("API Error: Start Game", { error: e.message });
    }
  };

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/status/${gameId}`);
      const data = await res.json();
      showOutput(data);
      addMessage("API: Game Status", data);
    } catch (e) {
      addMessage("API Error: Check Status", { error: e.message });
    }
  };

  return (
    <div className="container">
      <h1>Minuman Game (React UI)</h1>

      <button onClick={createGame}>Create Game</button>
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
      <button onClick={joinGame}>Join Game</button>
      <br />
      <button onClick={startGame}>Start Game</button>
      <br />
      <button onClick={checkStatus}>Check Game Status</button>

      <form onSubmit={sendMessage}>
        <h3>Chat Section</h3>
        <input type="text" onChange={(e) => setMessage(e.target.value)} value={message} />
        <button type="submit">Submit</button>
      </form>


      <h3>API Call Output:</h3>
      <pre>{output}</pre>

      <div>
        <button style={isConnected ? { backgroundColor: 'gray' } : {}} disabled={isConnected} onClick={setupConnection}>{isConnected ? "Connected" : "Connect to SignalR"}</button>
      </div>
      <h3>SignalR Messages:</h3>
      <div className="chat">
        <ul>
          {messages.map((msg, i) => (
            <li key={i} className={msg.isHeartbeat ? "heartbeat" : ""}>
              <span className="timestamp">[{msg.timestamp}]</span>{" "}
              <span className="event">{msg.eventType}:</span> {msg.data}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
