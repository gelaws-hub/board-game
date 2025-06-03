using PokerGameCore.Domain.Services;
using PokerGameCore.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins("http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Register SignalR and your custom services
builder.Services.AddSignalR();
builder.Services.AddSingleton<IGameRules, MinumanGameRules>();
builder.Services.AddSingleton<GameService>();

var app = builder.Build();
app.UseCors();

// Map your API controllers (after AddControllers!)
app.MapControllers();

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

app.Run();
