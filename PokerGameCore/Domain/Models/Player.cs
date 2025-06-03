namespace PokerGameCore.Domain.Models
{
    public class Player
    {
        public Guid Id { get; set; }
        public required User User { get; set; }
        public List<Card> Hand { get; set; } = new();
        public bool IsConnected { get; set; } = true;
    }
}
