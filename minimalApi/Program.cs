using System.Collections.ObjectModel;
using System.Threading.RateLimiting;
using FluentValidation;
using minimalApi;
using MongoDB.Bson;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

var mongoSettings = builder.Configuration.GetSection("MongoDB");

// MongoDB connection
builder.Services.AddSingleton<IMongoClient>(new MongoClient(mongoSettings["ConnectionString"]));
builder.Services.AddScoped(sp =>
    sp.GetRequiredService<IMongoClient>()
        .GetDatabase(mongoSettings["DatabaseName"])
        .GetCollection<Video>("CSharpVideosCollection")
);

//var mongoClient = new MongoClient("mongodb://localhost:27017");
//var database = mongoClient.GetDatabase("CloudFairVideoStreaming");
//var videosCollection = database.GetCollection<Video>("videodbs");

//builder.Services.AddValidation();
builder.Services.AddValidatorsFromAssemblyContaining<VideoValidator>();


builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ip,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(15),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 50,
            }
        );
    });

    options.AddPolicy(
        "search",
        context =>
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            return RateLimitPartition.GetFixedWindowLimiter(
                ip,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 10,
                }
            );
        }
    );

    options.AddPolicy(
        "videos",
        context =>
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

            return RateLimitPartition.GetFixedWindowLimiter(
                ip,
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 30,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 10,
                }
            );
        }
    );
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

var app = builder.Build();
app.UseRateLimiter();

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
        async (IMongoCollection<Video> collection) =>
        {
            try
            {
                var videos = await collection.Find(_ => true).ToListAsync();

                var videosDto = videos.Select(v => new VideosDto(
                    v.Id,
                    v.Title,
                    v.Description,
                    v.preview != null
                        ? new VideosPreviewDto(
                            v.preview.SpriteBaseUrl ?? "",
                            v.preview.frameInterval,
                            v.preview.spriteCount,
                            v.preview.cols,
                            v.preview.rows,
                            v.preview.frameWidth,
                            v.preview.frameHeight
                        )
                        : null,
                    v.UpdatedAt,
                    v.CreatedAt
                ));
                return Results.Ok(videosDto);
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
    )
    .RequireRateLimiting("videos");

app.MapGet(
    "/videos/{id}",
    async (string id, IMongoCollection<Video> collection) =>
    {
        if (id.Length != 24)
            return Results.BadRequest("Invalid ID fromat.");
        try
        {
            var video = await collection.Find(v => v.Id == id).FirstOrDefaultAsync();
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

app.MapGet(
        "/search",
        async (string? q, IMongoCollection<Video> collection) =>
        {
            if (string.IsNullOrWhiteSpace(q))
                return Results.BadRequest("Search Query is required");

            var filter = Builders<Video>.Filter.Text(q);

            var videos = await collection
                .Find(filter)
                .SortByDescending(v => v.CreatedAt)
                .ToListAsync();

            return Results.Ok(new { success = true, data = videos });
        }
    )
    .RequireRateLimiting("search");

app.MapPost(
    "/videos",
    async (Video newVideo, 
        IValidator<Video> validator, IMongoCollection<Video> collection) =>
    {
        newVideo.Id = null!;
        newVideo.CreatedAt = DateTime.UtcNow;
        newVideo.UpdatedAt = DateTime.UtcNow;

        try
        {
            await collection.InsertOneAsync(newVideo);
            return Results.Created($"/videos/{newVideo.Id}", newVideo);
        }
        catch (MongoException ex)
        {
            return Results.Problem("Failed to insert Video" + ex.Message);
        }
    }
);

app.MapDelete("/videos/{id}", async (string id, IMongoCollection<Video> collection) =>
{   
    if(!ObjectId.TryParse(id, out _))
    {
        return Results.BadRequest("Invalid ID format. Must be a 24 character - hex string.");
    }
    try
    {
        var result = await collection.DeleteOneAsync(v => v.Id == id); 

        if(result.DeletedCount == 0)
        {
            return Results.NotFound($"No Vidoe found with ID : {id}");
        }

        return Results.NoContent(); 
    }catch(MongoException ex)
    {
        return Results.Problem(detail: ex.Message, title: "Database error during deletion");
    }
}).RequireRateLimiting("videos");

app.MapPut("/videos/{id}", async (string id, Video updateVideo, 
        IValidator<Video> validator, IMongoCollection<Video> collection) =>
{
    if (id.Length != 24)
        return Results.BadRequest("Invalid ID format.");

    updateVideo.Id = id;
    updateVideo.UpdatedAt = DateTime.UtcNow;

    var result = await collection.ReplaceOneAsync(v => v.Id == id, updateVideo);

    if (result.MatchedCount == 0)
        return Results.NotFound();

    return Results.Ok(updateVideo);
});


app.Run();
