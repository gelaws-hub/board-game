"use client"

import { useState } from 'react';
import Card from "./Card"

const PlayerHand = ({ hand, onCardClick }) => {
    const [selectedCard, setSelectedCard] = useState(null);

    const handleCardClick = (card) => {
        if (selectedCard && selectedCard.suit === card.suit && selectedCard.rank === card.rank) {
            setSelectedCard(null);
        } else {
            setSelectedCard(card);
        }
        if (onCardClick) {
            onCardClick(card);
        }
    };

    const handlePlayCard = () => {
        if (selectedCard) {
            console.log("Playing card:", selectedCard);
            setSelectedCard(null);
        }
    };

    const handleDeselectCard = () => {
        setSelectedCard(null);
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div className="flex space-x-2 mb-4">
                <button
                    className={`px-3 py-1 bg-white text-blue-950 font-semibold rounded-md ${selectedCard ? 'hover:scale-105' : 'opacity-0 cursor-not-allowed'}`}
                    onClick={handlePlayCard}
                    disabled={!selectedCard}
                >
                    Play Card
                </button>

                <button
                    className={`px-3 py-1 bg-gray-300 text-gray-800 font-semibold rounded-md ${selectedCard ? 'hover:scale-105' : 'opacity-0 cursor-not-allowed'}`}
                    onClick={handleDeselectCard}
                    disabled={!selectedCard}
                >
                    Deselect
                </button>
            </div>
            <div className="flex space-x-2 overflow-x-scroll pb-2 w-96 py-4 px-4" style={{ scrollbarWidth: "thin" }}>
                {hand.map((card, index) => (
                    <div
                        key={index}
                        className={`transform transition-transform duration-200 ease-out hover:-translate-y-1
                            ${selectedCard && selectedCard.suit === card.suit && selectedCard.rank === card.rank
                                ? 'z-10 shadow-lg border-2 border-blue-500 rounded-lg'
                                : ''
                            }`}
                        onClick={() => handleCardClick(card)}
                    >
                        <Card suit={card.suit} rank={card.rank} onClick={() => handleCardClick(card)} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default PlayerHand;