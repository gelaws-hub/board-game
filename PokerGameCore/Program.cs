using PokerGameCore.Domain.Services;
using PokerGameCore.Hubs;
using System.Text.Json.Serialization;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins("http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:5173", "https://gourav-d.github.io")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Register SignalR and your custom services
// builder.Services.AddSignalR();
builder.Services.AddSingleton<IGameRules, MinumanGameRules>();
builder.Services.AddSingleton<GameService>();
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });


var app = builder.Build();
app.UseCors();

// Map your API controllers (after AddControllers!)
app.MapControllers();

// Map SignalR hub
app.MapHub<GameHub>("/gamehub");

app.Run();
