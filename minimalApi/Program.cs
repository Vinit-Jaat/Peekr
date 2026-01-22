using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// MongoDB connection
var mongoClient = new MongoClient("mongodb://localhost:27017");
var database = mongoClient.GetDatabase("CloudFairVideoStreaming");
var videosCollection = database.GetCollection<Video>("videodbs");

var app = builder.Build();
app.UseExceptionHandler("/error");

app.MapGet("/", () => "Home Page!");
app.MapGet("/about", () => "About Page!");

app.MapGet(
    "/error",
    () =>
    {
        return Results.Problem(
            title: "Something went wrong",
            detail: "An unexcepted error occured. Please try again later"
        );
    }
);

app.MapGet(
    "/videos",
    async () =>
    {
        try
        {
            var videos = await videosCollection.Find(_ => true).ToListAsync();
            return Results.Ok(videos);
        }
        catch (MongoException ex)
        {
            return Results.Problem(
                title: "Database error",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
);

app.MapGet(
    "/videos/{id}",
    async (string id) =>
    {
        try
        {
            var video = await videosCollection.Find(v => v.Id == id).FirstOrDefaultAsync();
            return video is null ? Results.NotFound() : Results.Ok(video);
        }
        catch (MongoException ex)
        {
            return Results.Problem(
                title: "Database error failed to fetch video by id.",
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
    }
);

app.Run();
