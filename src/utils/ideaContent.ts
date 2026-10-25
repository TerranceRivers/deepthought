import type { IdeaCard } from '../types';

export const IDEA_BODY_CHARACTER_LIMIT = 1000;

type IdeaContext = Pick<IdeaCard, 'title' | 'sourceTitle' | 'author' | 'actionableTakeaway'>;

const cleanBody = (body: string) =>
  body
    .replace(/\r\n/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Guarantees the product contract that every published idea body is exactly
 * 1,000 characters. Short model/fallback responses receive useful context;
 * overlong responses are clipped at a word boundary.
 */
export function normalizeIdeaBody(body: string, context: Partial<IdeaContext> = {}): string {
  const title = context.title?.trim() || 'this idea';
  const source = context.sourceTitle?.trim() || 'the source material';
  const author = context.author?.trim() || 'the author';
  const takeaway = context.actionableTakeaway?.trim();
  let result = cleanBody(body);

  const extensions = [
    `In practice, ${title} matters because understanding a principle is different from building it into everyday decisions. Look for the conditions that make the idea succeed, the friction that causes it to fail, and the smallest repeatable behavior that turns insight into evidence.`,
    `${author}'s reasoning in ${source} is most useful when tested against a real situation rather than admired in the abstract. Apply it to one current choice, observe the result, and refine your approach from feedback instead of expecting a perfect first attempt.`,
    `The deeper lesson is to connect intention, environment, and repetition. Clear cues make the desired response easier to begin; consistent review reveals whether the response is producing the intended effect; patient iteration allows small improvements to compound into durable change.`,
    takeaway
      ? `A practical starting point is this: ${takeaway} Treat that step as an experiment, record what changes, and keep the parts that create measurable progress.`
      : `A practical starting point is to choose one concrete action, schedule it, and define what observable result would count as progress. Reflection then becomes a tool for adjustment rather than a substitute for action.`,
  ];

  let extensionIndex = 0;
  while (result.length < IDEA_BODY_CHARACTER_LIMIT) {
    result += `${result ? '\n\n' : ''}${extensions[extensionIndex % extensions.length]}`;
    extensionIndex += 1;
  }

  if (result.length === IDEA_BODY_CHARACTER_LIMIT) return result;

  const visibleLimit = IDEA_BODY_CHARACTER_LIMIT - 1;
  const roughCut = result.slice(0, visibleLimit);
  const lastSpace = roughCut.lastIndexOf(' ');
  const wordSafeCut = lastSpace >= Math.floor(visibleLimit * 0.9) ? lastSpace : visibleLimit;
  const clipped = roughCut.slice(0, wordSafeCut).trimEnd();

  // Non-breaking spaces preserve the exact storage contract without exposing
  // a partial final word in the UI or narration.
  return `${clipped}${'\u00a0'.repeat(visibleLimit - clipped.length)}…`;
}

export function normalizeIdeaCard<T extends IdeaCard>(idea: T): T {
  const body = normalizeIdeaBody(idea.body || '', idea);
  return {
    ...idea,
    body,
    readTime: `${Math.max(1, Math.round(body.length / 500))} min read`,
  };
}

export function normalizeIdeaCards<T extends IdeaCard>(ideas: T[]): T[] {
  return ideas.map(normalizeIdeaCard);
}
