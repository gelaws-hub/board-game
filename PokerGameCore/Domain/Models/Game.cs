using PokerGameCore.Domain.Enums;

namespace PokerGameCore.Domain.Models
{
    public class Game
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public required string Name { get; set; }
        public List<Player> Players { get; set; } = [];
        public Player? GameLeader { get; set; }
        public Player? GameWinner { get; set; }

        public List<Card> BoardHistory { get; set; } = [];
        public List<Card> CurrentSubRoundCards { get; set; } = [];
        public Deck MinumPile { get; set; } = new();
        public GameState State { get; set; } = GameState.WaitingForPlayers;
        public int CurrentPlayerIndex { get; set; } = 0;

        public Card? CurrentBoardCard => CurrentSubRoundCards.LastOrDefault();

        public Player? CurrentPlayer =>
            Players.Count > CurrentPlayerIndex ? Players[CurrentPlayerIndex] : null;

        public bool IsAllPlayersReady => Players.All(p => p.IsReady);

        public User FindUserByUsername(string username)
        {
            return Players.Select(p => p.User)
                          .FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase))
                   ?? throw new Exception("User not found");
        }

        public Player FindPlayerByUsername(string username)
        {
            return Players.FirstOrDefault(p => p.User.Username.Equals(username, StringComparison.OrdinalIgnoreCase))
                   ?? throw new Exception("Player not found");
        }

        public IReadOnlyList<Card> GetCurrentBoard() => CurrentSubRoundCards.AsReadOnly();
    }
}
