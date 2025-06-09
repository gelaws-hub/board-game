using System.Collections.Concurrent;

namespace PokerGameCore.Hubs
{
    public class PlayerConnectionManager
    {
        // Maps player ID (Guid) to their SignalR ConnectionId
        private readonly ConcurrentDictionary<Guid, string> _connections = new();

        public void MapPlayerToConnection(Guid playerId, string connectionId)
        {
            _connections[playerId] = connectionId;
        }

        public bool TryGetConnection(Guid playerId, out string? connectionId)
        {
            return _connections.TryGetValue(playerId, out connectionId);
        }

        public void RemoveConnection(string connectionId)
        {
            var entry = _connections.FirstOrDefault(kvp => kvp.Value == connectionId);
            if (!entry.Equals(default(KeyValuePair<Guid, string>)))
            {
                _connections.TryRemove(entry.Key, out _);
            }
        }

        public void RemovePlayer(Guid playerId)
        {
            _connections.TryRemove(playerId, out _);
        }

        public void ClearAll()
        {
            _connections.Clear();
        }

        public int Count => _connections.Count;
    }
}
