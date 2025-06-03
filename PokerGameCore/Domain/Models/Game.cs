using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Domain.Models
{
    public class Game
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public List<Player> Players { get; set; } = [];
        public List<Card> BoardHistory { get; set; } = [];
        public Deck MinumPile { get; set; } = new();
        public GameState State { get; set; } = GameState.WaitingForPlayers;
        public int CurrentPlayerIndex { get; set; } = 0;
        public Card? CurrentBoardCard => BoardHistory.LastOrDefault();

        public Player? CurrentPlayer =>
        Players.Count > CurrentPlayerIndex ? Players[CurrentPlayerIndex] : null;

    }
}
