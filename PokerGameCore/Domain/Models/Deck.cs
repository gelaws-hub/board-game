using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Domain.Models
{
    public class Deck
    {
        private readonly Stack<Card> cards;

        public Deck()
        {
            var allCards = Enum.GetValues<CardSuit>()
                .SelectMany(suit => Enum.GetValues<CardRank>()
                .Select(rank => new Card { Suit = suit, Rank = rank }))
                .ToList();

            var rng = new Random();
            cards = new Stack<Card>(allCards.OrderBy(_ => rng.Next()));
        }

        public Card? DrawCard() => cards.Count > 0 ? cards.Pop() : null;
        public int Count => cards.Count;
        public void AddCards(IEnumerable<Card> cardsToAdd)
        {
            var rng = new Random();
            var shuffled = cardsToAdd.OrderBy(_ => rng.Next()).ToList();
            foreach (var card in shuffled)
            {
                cards.Push(card);
            }
        }

        public bool IsEmpty => cards.Count == 0;
    }
}
