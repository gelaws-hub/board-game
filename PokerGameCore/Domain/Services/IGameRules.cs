using PokerGameCalled.Domain.Models;

namespace PokerGameCalled.Domain.Services
{
    public interface IGameRules
    {
        bool TryPlayCard(Game game, Player player, Card card);
        Card? DrawCard(Game game, Player player);
        bool CheckGameEnd(Game game, out Player? winner);
        void NextTurn(Game game);
    }
}
