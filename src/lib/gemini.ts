import { GoogleGenAI } from '@google/genai';

const resolvedKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'dummy-gemini-key'
    ? process.env.GEMINI_API_KEY
    : 'AIzaSyDqaLhFtaP1NkQXUYC55Q853jlD3OCklCM';

const ai = new GoogleGenAI({ apiKey: resolvedKey });

// Using gemini-2.5-flash as the latest standard model
const DEFAULT_MODEL = 'gemini-2.5-flash';

/**
 * LMS Content Generator Prompt Template
 */
export async function generateLMSBundle(topicName: string, courseScope: string) {
    const prompt = `You are an expert medical educator preparing materials for university exams.
Generate structured, highly accurate notes for the topic "${topicName}" within the context of "${courseScope}".
Format exactly as a valid JSON object without markdown wrapping or any other text.
Follow this schema EXACTLY:
{
  "introduction": "Bullet points focused on exam relevance.",
  "detailedNotes": "Essay format covering definition, etiology, pathogenesis, clinical features, management, and complications.",
  "summary": "Concise 3-line revision or visual schema placeholder.",
  "flashcards": [ {"front": "Q", "back": "A"} ],
  "questions10": ["10 mark essay Q1", "Q2"],
  "questions5": ["5 mark short Q1", "Q2"],
  "questions3": ["3 mark reasoning Q1", "Q2"]
}`;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (error) {
        console.error('Error generating LMS Bundle:', error);
        throw new Error('Failed to generate LMS content from AI.');
    }
}

/**
 * AI Rubric Evaluator
 */
export async function evaluateStudentScript(
    studentAnswer: string,
    rubric: any,
    maxMarks: number
) {
    const prompt = `You are a strict medical examiner.
Evaluate the student answer against the provided rubric. 
Maximum possible marks: ${maxMarks}.

Student Answer:
"""
${studentAnswer}
"""

Approved Rubric:
"""
${JSON.stringify(rubric, null, 2)}
"""

Reply exclusively with this JSON structure:
{
  "marksAllocated": (number),
  "justification": "(explain why marks were given/deducted)",
  "missingKeywords": ["keyword1", "keyword2"]
}`;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (error) {
        console.error('Error evaluating script:', error);
        throw new Error('Failed to evaluate script.');
    }
}

/**
 * Answer Structurer (Student tool)
 */
export async function restructureAnswer(roughDraft: string) {
    const prompt = `Restructure the following medical student's rough draft into an academic format standard for university exams.
Structure it carefully using: Definition, Etiology, Pathogenesis, Clinical Features, Management, Complications.
Correct grammar and switch to formal clinical terminology.
Draft:
"""
${roughDraft}
"""`;

    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error structuring answer:', error);
        throw new Error('Failed to structure answer.');
    }
}
