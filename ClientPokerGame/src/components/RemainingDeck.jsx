import Card from "./Card"

const RemainingDeck = ({ count }) => {
  // Only show up to 3 cards in the visual stack
  const visibleCards = Math.min(count, 3)

  return (
    <div className="relative">
      {Array.from({ length: visibleCards }).map((_, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            top: `${index * 2}px`,
            left: `${index * 2}px`,
            zIndex: index,
          }}
        >
          <Card isBackFacing={true} />
        </div>
      ))}
      <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs absolute -bottom-2 -right-2 z-10">
        {count}
      </div>
    </div>
  )
}

export default RemainingDeck
