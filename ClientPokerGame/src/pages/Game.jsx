"use client"

import { useParams } from "react-router-dom"
import { useState, useSyncExternalStore } from "react"
import GameBoard from "../components/GameBoard"
import PlayerHand from "../components/PlayerHand"
import OpponentHand from "../components/OpponentHand"
import RemainingDeck from "../components/RemainingDeck"

const Game = () => {
    //   const { gameId } = useParams()

    // Sample data - in a real app, this would come from an API
    const [playerHand, setPlayerHand] = useState([
        { suit: 1, rank: 5 },
        { suit: 2, rank: 10 },
        { suit: 3, rank: 13 },
        { suit: 4, rank: 1 },
        { suit: 1, rank: 7 },
        { suit: 2, rank: 9 },
        { suit: 3, rank: 3 },
        { suit: 4, rank: 1 },
        { suit: 1, rank: 7 },
        { suit: 2, rank: 9 },
        { suit: 3, rank: 3 },
        { suit: 4, rank: 1 },
        { suit: 1, rank: 7 },
        { suit: 2, rank: 9 },
        { suit: 3, rank: 3 },
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

    const [opponents, setOpponents] = useState([
        { position: "left", cardCount: 10 },
        { position: "top", cardCount: 3 },
        { position: "right", cardCount: 4 },
    ])

    const [selectedPlayerCard, setSelectedPlayerCard] = useState(null);

    const handleCardClick = (card) => {
        setSelectedPlayerCard(card);
        console.log("Card clicked:", card)
        // Add your card action logic here
    }

    return (
        <div className="h-screen w-screen bg-green-800 overflow-hidden relative">
            <div className="absolute top-2 left-2 text-white">Game ID: gameId</div>

            {/* Left opponent */}
            <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 rotate-90">
                <OpponentHand position="left" count={opponents[0].cardCount} />
            </div>

            {/* Top opponent */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <OpponentHand position="top" count={opponents[1].cardCount} />
            </div>

            {/* Right opponent */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90">
                <OpponentHand position="right" count={opponents[2].cardCount} />
            </div>

            {/* Game board in the center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <GameBoard boardHistory={boardHistory} />
            </div>

            {/* Remaining deck */}
            <div className="absolute bottom-1/3 md:top-1/2 right-1/4 transform -translate-y-1/2">
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
