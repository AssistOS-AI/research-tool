import crawlers from "./../web/index.js";
import ai from "./../ai/index.js";

class ResearchAssistant {
    constructor(progressLogger, webScrapper, webscraperApiKey, aiModel, aiApiKey) {
        this.logger = console;
        //this.interaction = interaction;
        this.progressLogger = progressLogger;
        this.webAssistent = crawlers.getFireCrawlerInstance(webscraperApiKey, this.logger);
        this.aiAssistent = ai.getChatGPTAssistant(aiModel, aiApiKey, this.logger);
    }

/*    async getMainTopic() {
        console.log(`Welcome to the Research Assistant! Let's refine the research topic.`);
        const mainTopic = await this.interaction.question('Enter the main research area: ');

        return mainTopic;
    }*/

    async askRelevantQuestions(topic) {
        this.progressLogger.logStep("preresearch", "Generating short clarifying questions list");
        const clarifyingQuestions = await this.aiAssistent.getClarifyingQuestions(topic);
        this.progressLogger.logStep("preresearch", "Short clarifying questions list obtained");
        return clarifyingQuestions;

        /*let queries = [];
        for (const question of clarifyingQuestions) {
            const answer = await this.interaction.question(question + ' ');
            if(answer){
                queries.push(`Topic: ${topic} - Question: ${question} - Answer: ${answer}`);
            }
        }

        return queries;*/
    }

    async doResearch(mainTopic, targetContentType="academic papers", questionsAndAnswers){
        //const mainTopic = await this.getMainTopic();
        //const questionsAndAnswers = await this.askRelevantQuestions(mainTopic);

        //const targetContentType = await this.interaction.question('What type of content do you want to prioritize? (e.g., academic papers, blogs, news articles): ');
        this.progressLogger.logStep("research", "Digesting clarifying questions and their answers");
        let urls = [];
        for(let qa of questionsAndAnswers){
            let webQuery = await this.aiAssistent.convertClarifyingAnswerToWebQuery(qa, targetContentType);
            let references = await this.webAssistent.search(webQuery, targetContentType);
            urls = urls.concat(references);
        }

        if(!urls){
            throw Error(`Failed to find any inspiration urls for this topic: ${mainTopic}`);
        }

        this.progressLogger.setTotalUrls(urls.length);

        let summaries = [];
        for(let url of urls){
            let content = await this.webAssistent.scrape(url);
            let summary = await this.aiAssistent.analyzeContent(content);
            summaries.push(summary);
            this.progressLogger.incrementProcessedUrl();
        }

        this.progressLogger.logStep("writing", "Preparing to write the final report");

        let report = await this.aiAssistent.generateFinalReport(mainTopic, summaries, urls);

        this.progressLogger.logStep("writing", "Final report write finished");

        return report;
    }
}

export default ResearchAssistant;