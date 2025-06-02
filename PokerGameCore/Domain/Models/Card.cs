using PokerGameCalled.Domain.Enums;

namespace PokerGameCalled.Domain.Models
{
    public class Card
    {
        public CardSuit Suit { get; set; }
        public CardRank Rank { get; set; }

        public override string ToString() => $"{Rank} of {Suit}";
    }
}
