// Note modes and their templates. Shared by the server (prompting, validation) and the app (labels, docs).
export const modes = ['Lecture', 'Presentation', 'Meeting', 'Seminar'] as const;
export type Mode = typeof modes[number];

/**
 * How a section's items are shaped and drawn:
 * text: short paragraphs · bullet: plain list · point: list item with optional supporting detail
 * term: term + definition · qa: question + answer (becomes a study card) · task: checklist item, detail = owner/due if said
 */
export type Kind = 'text' | 'bullet' | 'point' | 'term' | 'qa' | 'task';
export type SectionSpec = { id: string; heading: string; kind: Kind; hint: string; max: number };

const s = (id: string, heading: string, kind: Kind, hint: string, max = 10): SectionSpec => ({ id, heading, kind, hint, max });

export const templates: Record<Mode, SectionSpec[]> = {
  Lecture: [
    s('summary', 'Summary', 'text', 'Two or three sentences on what the lecture covered.', 3),
    s('terms', 'Key terms', 'term', 'text is the term; detail is its definition as the lecturer explained it.'),
    s('ideas', 'Main ideas', 'point', 'text is one idea; detail is the supporting explanation, or empty.'),
    s('examples', 'Examples', 'point', 'text is the example; detail is what it shows, or empty.'),
    s('check', 'Check yourself', 'qa', 'text is a study question a student could be tested on; detail is the answer from the lecture.', 8),
  ],
  Presentation: [
    s('message', 'Main message', 'text', 'The one thing the speaker wants the audience to believe or do.', 2),
    s('outline', 'Outline', 'point', 'The talk’s points in order: text is the point; detail is the evidence or example given, or empty.', 12),
    s('takeaways', 'Key takeaways', 'bullet', 'What to remember afterwards.', 6),
    s('check', 'Check yourself', 'qa', 'text is a question about the talk; detail is its answer.', 6),
    s('questions', 'Questions to ask', 'bullet', 'Follow-up questions for the speaker about something said but left unclear or unanswered.', 5),
  ],
  Meeting: [
    s('summary', 'Summary', 'text', 'Two or three sentences on what the meeting was about.', 3),
    s('decisions', 'Decisions', 'bullet', 'Only decisions that were explicitly made.'),
    s('actions', 'Action items', 'task', 'text is the task; detail is the owner and due date only if said, else empty.'),
    s('open', 'Open questions', 'bullet', 'Questions raised but not resolved.'),
  ],
  Seminar: [
    s('topic', 'Topic', 'text', 'What the discussion was about.', 2),
    s('arguments', 'Arguments raised', 'point', 'text is a position someone argued; detail is their reasoning, or empty.', 12),
    s('agreements', 'Agreements', 'bullet', 'Points the group agreed on.'),
    s('disagreements', 'Disagreements', 'bullet', 'Points still in dispute, stated neutrally.'),
    s('followups', 'Ideas to follow up', 'bullet', 'Readings, questions or ideas to look into later.'),
  ],
};

export const isMode = (value: unknown): value is Mode => modes.includes(value as Mode);
