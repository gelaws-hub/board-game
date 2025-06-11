"use client"

import { useState } from "react"
import Card from "./Card"

const PlayerHand = ({ hand, onCardClick, toPlay = false }) => {
  const [selectedCard, setSelectedCard] = useState(null)
  const count = hand.length

  // Convert backend card format to frontend format
  const convertCard = (card) => {
    const suitMap = {
      Hearts: 1,
      Diamonds: 2,
      Clubs: 3,
      Spades: 4,
    }

    const rankMap = {
      Two: 2,
      Three: 3,
      Four: 4,
      Five: 5,
      Six: 6,
      Seven: 7,
      Eight: 8,
      Nine: 9,
      Ten: 10,
      Jack: 11,
      Queen: 12,
      King: 13,
      Ace: 14,
    }

    return {
      suit: suitMap[card.suit] || 1,
      rank: rankMap[card.rank] || 2,
    }
  }

  const handleCardClick = (card) => {
    const convertedCard = convertCard(card)

    if (selectedCard && selectedCard.suit === convertedCard.suit && selectedCard.rank === convertedCard.rank) {
      setSelectedCard(null)
    } else {
      setSelectedCard(convertedCard)
    }
  }

  const handlePlayCard = () => {
    if (selectedCard && onCardClick) {
      // Find the original card to pass back
      const originalCard = hand.find((card) => {
        const converted = convertCard(card)
        return converted.suit === selectedCard.suit && converted.rank === selectedCard.rank
      })

      if (originalCard) {
        onCardClick(originalCard)
        setSelectedCard(null)
      }
    }
  }

  const handleDeselectCard = () => {
    setSelectedCard(null)
  }

  return (
    <div className={`flex flex-col items-center justify-center ${toPlay ? "opacity-100" : "opacity-60"}`}>
      <div className="flex space-x-2 mb-2 sm:mb-4">
        <button
          className={`px-2 sm:px-3 py-1 bg-white text-blue-950 font-semibold rounded-md transition-all text-xs sm:text-sm ${
            selectedCard && toPlay ? "hover:scale-105 opacity-100" : "opacity-0 cursor-not-allowed"
          }`}
          onClick={handlePlayCard}
          disabled={!selectedCard || !toPlay}
        >
          Play Card
        </button>

        <button
          className={`px-2 sm:px-3 py-1 bg-white text-blue-950 font-semibold rounded-md transition-all text-xs sm:text-sm ${
            selectedCard ? "hover:scale-105 opacity-100" : "opacity-0 cursor-not-allowed"
          }`}
          onClick={handleDeselectCard}
          disabled={!selectedCard}
        >
          Deselect
        </button>
      </div>
      <div
        className="flex space-x-1 sm:space-x-2 overflow-x-scroll pb-2 w-80 sm:w-96 md:w-[80vw] md:overflow-x-auto py-2 sm:py-4 px-2 sm:px-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {hand.map((card, index) => {
          const convertedCard = convertCard(card)
          const isSelected =
            selectedCard && selectedCard.suit === convertedCard.suit && selectedCard.rank === convertedCard.rank

          return (
            <div
              key={index}
              className={`transform transition-transform duration-200 ease-out hover:-translate-y-1 ${
                isSelected ? "z-10 shadow-lg border-2 border-blue-500 rounded-lg" : ""
              }`}
              onClick={() => handleCardClick(card)}
            >
              <Card suit={convertedCard.suit} rank={convertedCard.rank} onClick={() => handleCardClick(card)} />
            </div>
          )
        })}
        <div className={`bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs absolute top-4 sm:top-8`}>
          My cards: {count}
        </div>
      </div>
    </div>
  )
}

export default PlayerHand
