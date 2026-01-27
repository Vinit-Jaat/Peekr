namespace minimalApi;

public record VideosDto(
    string Id,
    string Title,
    string Description,
    VideosPreviewDto? Preview,
    DateTime UpdatedAt,
    DateTime CreatedAt
);

public record VideosPreviewDto(
    string SpriteBaseUrl,
    int FrameInterval,
    int SpriteCount,
    int Cols,
    int Rows,
    int FrameWidth,
    int FrameHeight
);
