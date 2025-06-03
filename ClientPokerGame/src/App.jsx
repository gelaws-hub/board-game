import "./App.css"
import { SignalRProvider } from "./context/SignalRContext"
import GameLobby from "./pages/GameLobby"

export default function App() {
  return (
    <SignalRProvider >
      <GameLobby />
    </SignalRProvider>
  )
}