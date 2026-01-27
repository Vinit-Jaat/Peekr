using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

[BsonIgnoreExtraElements]
public class Video
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; set; } = null!;

    [BsonElement("description")]
    public string Description { get; set; } = null!;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; }

    [BsonElement("thumbnailPath")]
    public string ThumbnailPath { get; set; } = null!;

    [BsonElement("videoPath")]
    public string VideoPath { get; set; } = null!;

    [BsonElement("previewPath")]
    public string previewPath { get; set; } = null!;

    [BsonElement("preview")]
    public VideoPreview preview { get; set; } = null!;
}

[BsonIgnoreExtraElements]
public class VideoPreview
{
    [BsonElement("spriteBaseUrl")]
    public string SpriteBaseUrl { get; set; } = null!;

    [BsonElement("frameInterval")]
    public int frameInterval { get; set; }

    [BsonElement("spriteCount")]
    public int spriteCount { get; set; }

    [BsonElement("cols")]
    public int cols { get; set; }

    [BsonElement("rows")]
    public int rows { get; set; }

    [BsonElement("frameWidth")]
    public int frameWidth { get; set; }

    [BsonElement("frameHeight")]
    public int frameHeight { get; set; }
}
