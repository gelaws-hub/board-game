using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Domain.Models
{
    public class Player
    {
        public Guid Id { get; set; }
        public required User User { get; set; }
        public List<Card> Hand { get; set; } = new();
        public bool IsConnected { get; set; } = true;

        public Card? FindCardInHand(string rankStr, string suitStr)
        {
            if (Enum.TryParse<CardRank>(rankStr, ignoreCase: true, out var rank) &&
                Enum.TryParse<CardSuit>(suitStr, ignoreCase: true, out var suit))
            {
                return Hand.FirstOrDefault(card => card.Rank == rank && card.Suit == suit);
            }

            return null;
        }
    }
}
