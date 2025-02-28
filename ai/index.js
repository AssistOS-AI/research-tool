//import OpenAIApi from 'openai';

class ChatGPTAssistant{
    constructor(model="gpt-4o-mini", apikey, logger){
        this.openai = new OpenAIApi({ apikey });
        this.model = model;
        this.logger = logger;
    }

    async getClarifyingQuestions(topic, limit=5){
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: `You are a research assistant. Generate ${limit} clarifying questions to refine the research topic.` },
                    { role: 'user', content: `Generate ${limit} clarifying questions for research on: ${topic}` }
                ]
            });
            return response.choices[0].message.content.split('\n').filter(q => q.trim());
        } catch (error) {
            this.logger.error('Error generating questions:', error);
            return [];
        }
    }

    async convertClarifyingAnswerToWebQuery(answer, contentType){
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: `You are a research assistant. Generate a web query base on a clarifying question and it's answer.` },
                    { role: 'user', content: `Generate exactly one web query to search for the target content type ${contentType} by extracting relevant info from the following: ${answer}` }
                ]
            });
            return response.choices[0].message.content;
        } catch (error) {
            this.logger.error('Error generating query:', error);
            return [];
        }
    }

    async analyzeContent(content) {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a research assistant. Summarize the following content and extract key insights.' },
                    { role: 'user', content: content }
                ]
            });
            return response.choices[0].message.content;
        } catch (error) {
            this.logger.error('Error with OpenAI API:', error);
            return '';
        }
    }

    async generateFinalReport(topic, summaries, urls) {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: 'You are a research assistant. Combine the following summaries into a cohesive and well-structured research report.' },
                    { role: 'user', content: `You are doing a research about ${topic} by leveraging the following information: ${summaries.join('\n\n')}. At the end add a chapter called Bibliography containing the following urls: ${urls}` }
                ]
            });
            return response.choices[0].message.content;
        } catch (error) {
            this.logger.error('Error generating final report:', error);
        }
    }
}

export default {
    getChatGPTAssistant : function getChatGPTInstance(model, apikey, logger) {
        return new ChatGPTAssistant(model, apikey, logger);
    }
}