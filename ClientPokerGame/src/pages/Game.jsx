"use client"

import { useParams } from "react-router-dom"
import { useState, useSyncExternalStore } from "react"
import GameBoard from "../components/GameBoard"
import PlayerHand from "../components/PlayerHand"
import OpponentHand from "../components/OpponentHand"
import RemainingDeck from "../components/RemainingDeck"
import data from "../preview.json";

const Game = () => {
    const { gameId } = useParams()

    // Sample data - in a real app, this would come from an API
    const [playerHand, setPlayerHand] = useState([
        { suit: 1, rank: 5 },
        { suit: 2, rank: 10 },
        { suit: 3, rank: 13 },
        { suit: 4, rank: 1 },
        { suit: 4, rank: 2 },
        { suit: 4, rank: 3 },
        { suit: 4, rank: 4 },
    ])

    const [boardHistory, setBoardHistory] = useState([
        { suit: 2, rank: 5 },
        { suit: 1, rank: 14 },
        { suit: 3, rank: 3 },
        { suit: 4, rank: 1 },
        { suit: 1, rank: 7 },
        { suit: 2, rank: 9 },
        { suit: 3, rank: 3 },
        { suit: 4, rank: 2 },
    ])

    const [remainingCards, setRemainingCards] = useState(32)

    const users = data.players.map((p => p.user))

    const [opponents, setOpponents] = useState([
        { position: "left", cardCount: 7 },
        { position: "top", cardCount: 3 },
        { position: "right", cardCount: 10 },
    ])

    const [selectedPlayerCard, setSelectedPlayerCard] = useState(null);

    const handleCardClick = (card) => {
        setSelectedPlayerCard(card);
        console.log("Card clicked:", card)
        // Add your card action logic here
    }

    return (
        <div className="h-screen w-screen bg-green-800 overflow-hidden relative">
            <div className="absolute bottom-2 left-2 text-white/70 text-xs">Game ID: {gameId}</div>

            <div className="bg-green-900 p-1 text-green-100">
                <h2 className="text-center">Turn : {users[0].username}</h2>
            </div>

            {/* Left opponent */}
            <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 rotate-90">
                <OpponentHand position="left" count={opponents[0].cardCount} user={users[1]} />
                <p className="absolute bg-black bg-opacity-50 text-white px-2 py-2 rounded-full text-xs text-center -rotate-90 bottom-7 -right-16">{users[1].username}</p>
            </div>

            {/* Top opponent */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                <OpponentHand position="top" count={opponents[1].cardCount} user={users[2]} />
                <p className="bg-black bg-opacity-50 text-white px-2 py-2 rounded-full text-xs text-center">{users[2].username}</p>
            </div>

            {/* Right opponent */}
            <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 rotate-90">
                <OpponentHand position="right" count={opponents[2].cardCount} user={users[3]} />
                <p className="absolute bg-black bg-opacity-50 text-white px-2 py-2 rounded-full text-xs text-center -rotate-90 bottom-7 -right-16">{users[1].username}</p>
            </div>

            {/* Game board in the center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <GameBoard boardHistory={boardHistory} />
            </div>

            {/* Remaining deck */}
            <div className="absolute bottom-1/4 right-1/4 transform -translate-y-1/2">
                <RemainingDeck count={remainingCards} />
            </div>

            {/* Player's hand at the bottom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <PlayerHand hand={playerHand} onCardClick={handleCardClick} />
            </div>
        </div>
    )
}

export default Game
