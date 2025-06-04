import Card from "./Card"

const OpponentHand = ({ position, count }) => {
    const getPositionStyles = () => {
        switch (position) {
            case "left":
                return "flex-row space-x-[-40px]"
            case "top":
                return "flex-row space-x-[-48px]"
            case "right":
                return "flex-row space-x-[-40px]"
            default:
                return "flex-row space-x-[-48px]"
        }
    }


    return (
        <div className={`flex w-[215px] justify-center border-dashed border rounded-lg p-1 ${getPositionStyles()}`}>
            {Array.from({ length: count }).map((_, index) => (
                index < 10 ?
                    (<div key={index} className="transform transition-transform">
                        <Card isBackFacing={true} />
                    </div>) : null
            ))}
            <div className={`bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs absolute ${position == "top" ? "bottom-8 -right-2" : "-rotate-90 -top-2 -right-2"}`}>
                {count}
            </div>
        </div>
    )
}

export default OpponentHand
