using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// MongoDB connection
var mongoClient = new MongoClient("mongodb://localhost:27017");
var database = mongoClient.GetDatabase("CloudFairVideoStreaming");
var videosCollection = database.GetCollection<Video>("videodbs");

var app = builder.Build();

app.MapGet("/", () => "Home Page!");
app.MapGet("/about", () => "About Page!");

app.MapGet(
    "/videos",
    async () =>
    {
        var videos = await videosCollection.Find(_ => true).ToListAsync();
        return Results.Ok(videos);
    }
);

app.MapGet(
    "/videos/{id}",
    async (string id) =>
    {
        var video = await videosCollection.Find(v => v.Id == id).FirstOrDefaultAsync();
        return video is null ? Results.NotFound() : Results.Ok(video);
    }
);

app.Run();
