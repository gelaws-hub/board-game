"use client"

import Card from "./Card"

const RemainingDeck = ({ count, onDrawCard }) => {
  const visibleCards = Math.min(count, 2)

  return (
    <div className="relative w-full h-full">
      {/* Full-size transparent button on top */}
      <button
        onClick={onDrawCard}
        className="absolute inset-0 w-full h-full z-20"
        aria-label={count === 0 ? "Refill deck" : "Draw a card"}
      />

      <div className="flex flex-row mb-2 sm:mb-3 mx-auto relative z-10 pointer-events-none">
        {count === 0 ? (
          <div className="relative">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs/4 font-medium z-10">
              Refill
            </span>
            <Card classNameBack="grayscale brightness-50" isBackFacing={true} />
          </div>
        ) : (
          Array.from({ length: visibleCards }).map((_, index) => (
            <div
              key={index}
              className="relative"
              style={{
                marginLeft: `${(index * -50) * index}px`,
                zIndex: 20 + index,
              }}
            >
              {index === visibleCards - 1 && (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-xs/4 font-medium z-10">
                  Draw Card
                </span>
              )}
              <Card
                classNameBack={onDrawCard ? "" : "filter saturate-50"}
                isBackFacing={true}
              />
            </div>
          ))
        )}

        {/* Card count badge (still shows even when 0) */}
        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs absolute -bottom-7 right-2 z-10">
          {count}
        </div>
      </div>
    </div>
  )
}

export default RemainingDeck
