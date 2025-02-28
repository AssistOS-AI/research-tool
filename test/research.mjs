import fs from 'fs';
import readlineSync from 'readline-sync';
import OpenAIApi from 'openai';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

class ResearchProgress {
    constructor() {
        this.currentStep = '';
        this.urlsProcessed = 0;
        this.totalUrls = 0;
    }

    logStep(step) {
        this.currentStep = step;
        console.log(`\n[Research Progress] ${step}...`);
    }

    setTotalUrls(count) {
        this.totalUrls = count;
        console.log(`[Research Progress] Total URLs to process: ${count}`);
    }

    incrementProcessed() {
        this.urlsProcessed++;
        console.log(`[Research Progress] ${this.urlsProcessed}/${this.totalUrls} URLs processed.`);
    }
}

class ResearchAssistant {
    static async generateClarifyingQuestions(topic) {
        const openai = new OpenAIApi({ apiKey: OPENAI_API_KEY });
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a research assistant. Generate 5 clarifying questions to refine the research topic.' },
                    { role: 'user', content: `Generate 5 clarifying questions for research on: ${topic}` }
                ]
            });
            return response.choices[0].message.content.split('\n').filter(q => q.trim());
        } catch (error) {
            console.error('Error generating questions:', error);
            return [];
        }
    }

    static async askResearchQuestions() {
        console.log(`Welcome to the Research Assistant! Let's refine the research topic.`);
        const mainTopic = readlineSync.question('Enter the main research area: ');
        const clarifyingQuestions = await ResearchAssistant.generateClarifyingQuestions(mainTopic);

        let queries = [];
        for (const question of clarifyingQuestions) {
            const answer = readlineSync.question(question + ' ');
            queries.push(`Topic: ${mainTopic} - Question: ${question} - Answer: ${answer}`);
        }

        return {queries, mainTopic};
    }

    static async searchMultipleQueries(queries, contentType) {
        let allResults = [];
        for (const query of queries) {
            console.log(`Searching Firecrawl for: ${query}`);
            const results = await searchFirecrawl(query, contentType);
            allResults = allResults.concat(results); // Limit to 5 results per query
        }
        return allResults;
    }
}

class ReportGenerator {
    static async generateFinalReport(topic, summaries) {
        const openai = new OpenAIApi({ apiKey: OPENAI_API_KEY });
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a research assistant. Combine the following summaries into a cohesive and well-structured research report.' },
                    { role: 'user', content: `You are doing a research about ${topic} by leveraging the following information: ${summaries.join('\n\n')}` }
                ]
            });
            const finalReport = response.choices[0].message.content;
            fs.writeFileSync('final_report.md', finalReport);
            console.log('Final research report saved as final_report.md');
        } catch (error) {
            console.error('Error generating final report:', error);
        }
    }
}

class WebScraper {
    static async scrapeWebpage(url) {
        try {
            const options = {
                method: 'POST',
                headers: {Authorization: `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json'},
                body: `{"url":"${url}","formats":["markdown"],"onlyMainContent":true,"waitFor":0,"mobile":false,"skipTlsVerification":false,"timeout":30000,"removeBase64Images":true,"blockAds":true,"proxy":"basic"}`
            };

            let response = await fetch('https://api.firecrawl.dev/v1/scrape', options)
                .then(response => response.json());

            //return response.data.text.slice(0, 5000);
            return response.data.markdown.slice(0, 5000);
        } catch (error) {
            console.warn('Skipping URL:', url, 'Error:', error.message);
            return '';
        }
    }
}

async function searchFirecrawl(query, contentType) {
    try {
        /*const response = await axios.get('https://api.firecrawl.dev/v1/search', {
            headers: { 'Authorization': `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json' },
            params: { query: `${query} ${contentType}`, limit: 10, timeout: 60000}
        });*/

        const options = {
            method: 'POST',
            headers: {Authorization: `Bearer ${FIRECRAWL_API_KEY}`, 'Content-Type': 'application/json'},
            body: `{"query":"${query} ${contentType}","limit":2,"timeout":60000}`
        };

        let response = await fetch('https://api.firecrawl.dev/v1/search', options)
            .then(response => response.json());

        return response.data.map(result => result.url);
    } catch (error) {
        console.error('Error searching Firecrawl:', error);
        return [];
    }
}

class ContentAnalyzer {
    constructor(apiKey, model = 'gpt-4o-mini') {
        this.openai = new OpenAIApi({ apiKey });
        this.model = model;
    }

    async analyzeContent(content) {
        const openai = new OpenAIApi({ apiKey: OPENAI_API_KEY });
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a research assistant. Summarize the following content and extract key insights.' },
                    { role: 'user', content: content }
                ]
            });
            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error with OpenAI API:', error);
            return '';
        }
    }
}

(async () => {
    const progress = new ResearchProgress();
    progress.logStep('Asking research questions');
    const {queries:researchQueries, mainTopic} = await ResearchAssistant.askResearchQuestions();

    const contentType = readlineSync.question('What type of content do you want to prioritize? (e.g., academic papers, blogs, news articles): ');

    progress.logStep('Performing SERP search');
    let urls = await ResearchAssistant.searchMultipleQueries(researchQueries, contentType);

    //const urls = await searchFirecrawl(researchQueries.query, researchQueries.contentType);
    progress.setTotalUrls(urls.length);

    const summaries = [];
    const analyzer = new ContentAnalyzer(OPENAI_API_KEY);

    for (const url of urls) {
        progress.logStep(`Scraping: ${url}`);
        const content = await WebScraper.scrapeWebpage(url);
        if (content) {
            progress.logStep('Analyzing content');
            const summary = await analyzer.analyzeContent(content);
            summaries.push(summary);
        }
        progress.incrementProcessed();
    }

    progress.logStep('Building final research report');
    await ReportGenerator.generateFinalReport(mainTopic, summaries);
})();