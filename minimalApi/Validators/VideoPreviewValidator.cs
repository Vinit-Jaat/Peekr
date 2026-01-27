using FluentValidation;

public class VideoPreviewValidator : AbstractValidator<VideoPreview>
{
    public VideoPreviewValidator()
    {
        RuleFor(p => p.SpriteBaseUrl)
            .NotEmpty();

        RuleFor(p => p.frameInterval)
            .GreaterThan(0);

        RuleFor(p => p.spriteCount)
            .GreaterThan(0);

        RuleFor(p => p.cols)
            .GreaterThan(0);

        RuleFor(p => p.rows)
            .GreaterThan(0);

        RuleFor(p => p.frameWidth)
            .GreaterThan(0);

        RuleFor(p => p.frameHeight)
            .GreaterThan(0);
    }
}
