namespace Novar.Web.Models;

public sealed record GameCard(string Id, string Number, string Badge, string Title, string Description, bool Featured);
public sealed record GameStep(string Number, string Title, string Description);
public sealed record TriviaQuestion(string Question, string[] Options, int CorrectIndex);
public sealed record TriviaContent(string Title, string Disclaimer, TriviaQuestion[] Questions);
public sealed record GamesContent(
    string SourceNode, string TitleLead, string TitleRest, string SubtitleLead, string SubtitleRest,
    GameCard[] Cards, string HowEyebrow, string HowTitle, GameStep[] Steps,
    string PreviewTitle, string RoundLabel, string ScoreLabel, string PreviewInstruction, string DemoNotice,
    TriviaContent Trivia);
