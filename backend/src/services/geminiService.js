const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found in environment variables');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async generateSummary(notes) {
    if (!this.genAI) {
      // Return mock summary when API key is not configured
      return `Summary of ${notes.length} item note(s): ${notes.join(' | ')}. (Note: This is a mock summary. Configure GEMINI_API_KEY for AI-generated summaries.)`;
    }

    if (!notes || notes.length === 0) {
      return 'No notes available to summarize.';
    }

    try {
      const modelName = process.env.GEMINI_MODAL || 'gemini-2.5-flash';
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        Please provide a concise and professional summary of the following invoice item notes.
        Focus on key details, requirements, specifications, and any important information.
        Keep the summary clear and organized:

        Notes:
        ${notes.join('\n\n')}
        
        Summary:
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating Gemini summary:', error);
      // Fallback to mock summary when API fails
      return `Summary of ${notes.length} item note(s): ${notes.join(' | ')}. (Note: This is a fallback summary due to API issues.)`;
    }
  }
}

module.exports = new GeminiService();
