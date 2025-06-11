import Card from "./Card"

const GameBoard = ({ boardHistory = [], currentSubRoundCards = [] }) => {
  // Show up to 4 cards in each stack
  const maxVisibleCards = 4

  return (
    <div className="flex items-center justify-center gap-4 md:gap-16">
      {/* Board History Stack (left side) */}
      {boardHistory.length > 0 && (
        <div className="relative w-10 h-14 sm:w-12 sm:h-16 md:w-14 md:h-20">
          <div className="absolute top-0 left-0">
            {boardHistory.slice(-maxVisibleCards).map((card, index) => (
              <div
                key={`history-${index}`}
                className="absolute"
                style={{
                  top: `${index * 2}px`,
                  left: `${index * 2}px`,
                  zIndex: index,
                }}
              >
                <Card suit={getSuitNumber(card.suit)} rank={getRankNumber(card.rank)} />
              </div>
            ))}
            {boardHistory.length > 0 && (
              <div className="absolute -top-6 sm:-top-7 left-0 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                History: {boardHistory.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Round Cards (center) */}
      <div className="bg-green-700 rounded-full w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center relative">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {currentSubRoundCards.length > 0 ? (
            currentSubRoundCards.slice(-maxVisibleCards).map((card, index) => (
              <div
                key={`current-${index}`}
                className="absolute"
                style={{
                  top: `${index * 2}px`,
                  left: `${index * 2}px`,
                  zIndex: index,
                }}
              >
                <Card suit={getSuitNumber(card.suit)} rank={getRankNumber(card.rank)} />
              </div>
            ))
          ) : (
            <div className="text-white text-center">
              <div className="text-xs sm:text-sm">No cards played</div>
            </div>
          )}
          {currentSubRoundCards.length > 0 && (
            <div className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
              Current: {currentSubRoundCards.length}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions to convert string suit/rank to numbers
function getSuitNumber(suit) {
  const suitMap = {
    Hearts: 1,
    Diamonds: 2,
    Clubs: 3,
    Spades: 4,
  }
  return suitMap[suit] || 1
}

function getRankNumber(rank) {
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
  return rankMap[rank] || 2
}

export default GameBoard
