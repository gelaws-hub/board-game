"use client"

import Card from "./Card"

const RemainingDeck = ({ count, onDrawCard }) => {
  // Only show up to 3 cards in the visual stack
  const visibleCards = Math.min(count, 3)

  return (
    <button onClick={onDrawCard} className="relative flex flex-col justify-center h-full w-full">
      <div className="relative mb-2 sm:mb-3 mx-auto">
        {Array.from({ length: visibleCards }).map((_, index) => (
          <div
            key={index}
            className="absolute"
            style={{
              top: `${index * 2}px`,
              left: `${(index - 12) * 2}px`,
              zIndex: index,
            }}
          >
            <Card isBackFacing={true} />
          </div>
        ))}
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs absolute -bottom-2 right-2 z-10">
          {count}
        </div>
      </div>
      {/* Draw Card button positioned below the deck */}
      {onDrawCard && (
        <div
          className="sm:mt-6 bg-blue-600/80 hover:bg-blue-700/80 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm z-10 mt-16"
        >
          Draw Card
        </div>
      )}
    </button>
  )
}

export default RemainingDeck
