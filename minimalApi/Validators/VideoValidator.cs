using FluentValidation;

public class VideoValidator : AbstractValidator<Video>
{
    public VideoValidator()
    {
        RuleFor(v => v.Title)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(200);

        RuleFor(v => v.Description)
            .NotEmpty()
            .MinimumLength(10)
            .MaximumLength(2000);

        RuleFor(v => v.ThumbnailPath)
            .NotEmpty();

        RuleFor(v => v.VideoPath)
            .NotEmpty();

        RuleFor(v => v.previewPath)
            .NotEmpty();

        RuleFor(v => v.preview)
            .NotNull()
            .SetValidator(new VideoPreviewValidator());
    }
}
