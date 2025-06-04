"use client"

const Card = ({ suit, rank, isBackFacing = false, onClick }) => {
    // Map suit numbers to symbols
    const getSuitSymbol = (suit) => {
        switch (suit) {
            case 1:
                return "♥" // Hearts
            case 2:
                return "♦" // Diamonds
            case 3:
                return "♣" // Clubs
            case 4:
                return "♠" // Spades
            default:
                return ""
        }
    }

    // Map suit numbers to colors
    const getSuitColor = (suit) => {
        return suit === 1 || suit === 2 ? "text-red-600" : "text-black"
    }

    // Map rank numbers to display values
    const getRankDisplay = (rank) => {
        switch (rank) {
            case 11:
                return "J"
            case 12:
                return "Q"
            case 13:
                return "K"
            case 14:
                return "A"
            default:
                return rank.toString()
        }
    }

    if (isBackFacing) {
        return (
            <div
                className="w-14 h-20 rounded-md bg-blue-800 border-2 border-white flex items-center justify-center shadow-md"
                style={{ backgroundImage: "repeating-linear-gradient(45deg, #1e40af, #1e40af 5px, #1e3a8a 5px, #1e3a8a 10px)" }}
            ></div>
        )
    }

    return (
        <div
            className={`w-14 h-20 rounded-md bg-white border border-gray-300 flex flex-col p-1 shadow-md cursor-pointer hover:shadow-lg transition-shadow`}
            onClick={() => onClick && onClick({ suit, rank })}
        >
            <div className={`text-sm font-bold ${getSuitColor(suit)} flex justify-between`}>
                <span>{getRankDisplay(rank)}</span>
                <span>{getSuitSymbol(suit)}</span>
            </div>
            <div className={`flex-grow flex items-center justify-center ${getSuitColor(suit)} text-2xl`}>
                {getSuitSymbol(suit)}
            </div>
            <div className={`text-sm font-bold ${getSuitColor(suit)} flex justify-between rotate-180`}>
                <span>{getRankDisplay(rank)}</span>
                <span>{getSuitSymbol(suit)}</span>
            </div>
        </div>
    )
}

export default Card
