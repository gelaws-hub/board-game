import Card from "./Card"

const GameBoard = ({ boardHistory }) => {
    const shownNum = 4;

    return (
        <div className="bg-green-700 rounded-full w-40 h-40 flex items-center justify-center relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex">
                {boardHistory.map((card, index) => (
                    index < shownNum ?
                        <div key={index}
                            className="absolute  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                top: `${index * 2}px`,
                                left: `${index * 2}px`,
                                zIndex: index,
                            }}>
                            <Card key={index} suit={card.suit} rank={card.rank} />
                        </div>
                        : null
                ))}
            </div>
        </div>
    )
}

export default GameBoard
