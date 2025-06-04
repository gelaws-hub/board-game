export default function GameList({ availableGames }) {

    return (
        <div>
            <h3>Available Games (from SignalR Hub)</h3>
            {availableGames.length > 0 ? (
                <ul>
                    {availableGames.map((game) => (
                        <li key={game.id} >
                            <button>
                                ID: {game.id} | Players: {game.players.length} | State: {game.state}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No games available.</p>
            )}
        </div>
    )
}