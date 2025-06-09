// Create a new component to show connection status
import { useSignalR } from "../context/SignalRContext"

const ConnectionStatus = () => {
  const { isConnected, reconnecting } = useSignalR()

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-3 h-3 rounded-full ${
          reconnecting ? "bg-yellow-400" : isConnected ? "bg-green-400" : "bg-red-400"
        } ${reconnecting ? "animate-pulse" : ""}`}
      ></div>
      <span>{reconnecting ? "Reconnecting..." : isConnected ? "Connected" : "Disconnected"}</span>
    </div>
  )
}

export default ConnectionStatus
