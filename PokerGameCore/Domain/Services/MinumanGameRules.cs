using PokerGameCore.Domain.Models;
using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Domain.Services
{
    public class MinumanGameRules : IGameRules
    {
        public bool TryPlayCard(Game game, Player player, Card card)
        {
            if (!player.Hand.Contains(card))
                return false;

            if (game.CurrentSubRoundCards.Count > 0)
            {
                CardSuit firstCardSuit = game.CurrentSubRoundCards[0].Suit;
                if (card.Suit != firstCardSuit)
                    return false;
            }

            player.Hand.Remove(card);
            game.CurrentSubRoundCards.Add(card);
            game.CurrentSubRoundPlays.Add((card, player));
            return true;
        }

        public Card? DrawCard(Game game, Player player)
        {
            if (game.MinumPile.IsEmpty)
                RefillMinumPile(game);

            if (game.MinumPile.IsEmpty)
                return null;

            Card? drawn = game.MinumPile.DrawCard();
            if (drawn == null)
                return null;

            player.Hand.Add(drawn);

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
            int expectedPlays = game.Players.Count;

            if (game.CurrentSubRoundPlays.Count == expectedPlays)
            {
                var leadSuit = game.CurrentSubRoundPlays[0].Card.Suit;

                var winningPlay = game.CurrentSubRoundPlays
                    .Where(p => p.Card.Suit == leadSuit)
                    .OrderByDescending(p => p.Card.Rank)
                    .First();

                game.SubRoundWinner = winningPlay.Player;
                game.CurrentPlayerIndex = game.Players.FindIndex(p => p.Id == winningPlay.Player.Id);

                game.BoardHistory.AddRange(game.CurrentSubRoundPlays.Select(p => p.Card));
                game.CurrentSubRoundPlays.Clear();
                game.CurrentSubRoundCards.Clear();
            }
            else
            {
                game.CurrentPlayerIndex = (game.CurrentPlayerIndex + 1) % game.Players.Count;
            }
        }



        private static void RefillMinumPile(Game game)
        {
            if (game.BoardHistory.Count <= 0)
                return;

            // Keep the last card on board, recycle the rest into the pile
            List<Card> refillSource = game.BoardHistory.Take(game.BoardHistory.Count).ToList();
            game.BoardHistory = game.BoardHistory.Skip(game.BoardHistory.Count).ToList();
            game.MinumPile.AddCards(refillSource);
        }
    }
}
