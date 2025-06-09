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
            int expectedCards;

            // First sub-round of a full round (everyone plays)
            if (game.CurrentBoardCard == null)
            {
                expectedCards = game.Players.Count;
            }
            else
            {
                // Sub-rounds after the first (1 player has already played into CurrentBoardCard)
                expectedCards = game.Players.Count;
            }

            // Now include the CurrentBoardCard as the first card in the round
            int totalCardsThisRound = game.CurrentSubRoundCards.Count;

            // If the expected number of cards for this round is played
            if (totalCardsThisRound == expectedCards)
            {
                CardSuit firstCardSuit = game.CurrentSubRoundCards[0].Suit;
                Card highestCard = game.CurrentSubRoundCards
                    .Where(c => c.Suit == firstCardSuit)
                    .OrderByDescending(c => c.Rank)
                    .First();

                int winnerIndex = game.CurrentSubRoundCards.FindIndex(c =>
                    c.Suit == highestCard.Suit && c.Rank == highestCard.Rank);

                if (winnerIndex != -1)
                {
                    // Assign new starting player for next sub-round
                    game.CurrentPlayerIndex = winnerIndex;

                    // Push cards to history and prepare next sub-round
                    game.BoardHistory.AddRange(game.CurrentSubRoundCards);
                    game.CurrentSubRoundCards.Clear();

                    return;
                }
            }

            // Otherwise, continue to the next player in turn
            game.CurrentPlayerIndex = (game.CurrentPlayerIndex + 1) % game.Players.Count;
        }



        private static void RefillMinumPile(Game game)
        {
            if (game.BoardHistory.Count <= 1)
                return;

            // Keep the last card on board, recycle the rest into the pile
            var refillSource = game.BoardHistory.Take(game.BoardHistory.Count - 1).ToList();
            game.BoardHistory = game.BoardHistory.Skip(game.BoardHistory.Count - 1).ToList();
            game.MinumPile.AddCards(refillSource);
        }
    }
}
