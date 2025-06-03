using PokerGameCore.Domain.Models;

namespace PokerGameCore.Domain.Services
{
    public class MinumanGameRules : IGameRules
    {
        public bool TryPlayCard(Game game, Player player, Card card)
        {
            var boardCard = game.CurrentBoardCard;

            if (boardCard == null)
                return false;

            if (card.Suit != boardCard.Suit)
                return false;

            if (!player.Hand.Contains(card))
                return false;

            player.Hand.Remove(card);
            game.BoardHistory.Add(card);
            return true;
        }

        public Card? DrawCard(Game game, Player player)
        {
            if (game.MinumPile.IsEmpty)
                RefillMinumPile(game);

            if (game.MinumPile.IsEmpty)
                return null;

            var drawn = game.MinumPile.DrawCard();
            if (drawn == null)
                return null;

            player.Hand.Add(drawn);

            if (game.CurrentBoardCard == null)
                return null;

            // Auto-play if it matches the board suit
            // if (drawn.Suit == game.CurrentBoardCard.Suit)
            // {
            //     player.Hand.Remove(drawn);
            //     game.BoardHistory.Add(drawn);
            //     return drawn;
            // }

            return drawn;
        }

        public bool CheckGameEnd(Game game, out Player? winner)
        {
            winner = game.Players.FirstOrDefault(p => p.Hand.Count == 0);
            return winner != null;
        }

        public void NextTurn(Game game)
        {
            game.CurrentPlayerIndex = (game.CurrentPlayerIndex + 1) % game.Players.Count;
        }

        private static void RefillMinumPile(Game game)
        {
            if (game.BoardHistory.Count <= 1)
                return;

            var refillSource = game.BoardHistory.Take(game.BoardHistory.Count - 1).ToList();
            game.BoardHistory = game.BoardHistory.Skip(game.BoardHistory.Count - 1).ToList();

            game.MinumPile.AddCards(refillSource);
        }
    }
}
