import Web from "./../../web/index.js";

export class DefaultPresenter {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        this.invalidate(async () => {
        });
    }

    async beforeRender() {
        try{
            this.firecrawlerapikey = await fetch(`${window.location.protocol}//${window.location.host}/getSSOSecret/Demiurge`,
                {
                    method: "GET",
                    headers: {"user-id": assistOS.space.id}
                }
            )
            this.firecrawlerapikey = await this.firecrawlerapikey.text();
        }catch (e){
            console.error(e);
        }
    }

    async afterRender() {
    }

    async changeTab(tabButton, tabName) {
        const currentTab = this.element.querySelector(".visible-tab");
        currentTab.classList.remove("visible-tab");
        currentTab.style.display = "none";
        const tab = await this.element.querySelector("#" + tabName);
        tab.classList.add("visible-tab");
        tab.style.display = "block";
    }

    async openResearchDialog() {
        const result = await assistOS.UI.showModal("init-research-modal", {
            "presenter": "init-research-modal"
        }, true);

        this.research = {};
        this.research.researchTopic = result.researchTopic;
        this.research.personality = result.personality;
        this.research.contentType = result.contentType;

        this.research.clarifyingQuestions = await this.getClarifyingQuestions(result);
        this.getClarifications();
    }

    async getClarifications(clarifyingQuestions) {
        const clarifications = await assistOS.UI.showModal("clarifying-questions-modal", {
            "presenter": "clarifying-questions-modal",
            "questions": this.research.clarifyingQuestions
        }, true);

        this.research.clarifications = clarifications;

        let queries = [];
        for (const index in clarifications.questions) {
            const question = clarifications.questions[index];
            const answer = clarifications.answers[index];
            queries.push(`Topic: ${this.research.researchTopic} - Question: ${question} - Answer: ${answer}`);
        }

        this.research.queries = queries;
        this.obtainBibliografy();
    }

    async getPersonalityObject() {
        const personalityModule = await require('assistos').loadModule("personality", {});

        const personality = await personalityModule.getPersonality(assistOS.space.id, this.research.personality);
        if (!personality) {
            throw new Error('Personality not found by ID');
        }

        const personalityObj = await personalityModule.getPersonalityByName(assistOS.space.id, personality.name);
        if (!personalityObj) {
            throw new Error('Personality not found by name');
        }
        return personalityObj;
    }

    async getClarifyingQuestions(input) {
        let loaderId = assistOS.UI.showLoading();
        const personalityObj = await this.getPersonalityObject();
        const llmModule = await require('assistos').loadModule("llm", {});

        let limit = 2;
        let prompt = `You are a research assistant. Generate ${limit} clarifying questions to refine the research topic. The purpose of the questions is to properly identify the specific areas in which the user has interest to research. Topic: ${input.researchTopic} . Please provide just the questions and not other text.`
        let result = await llmModule.generateText(assistOS.space.id, prompt, personalityObj.id);

        let questions = result.message/*.split("\n")*/;

        /*if(questions.length !== limit){
            throw new Error("Failed to generate clarifying questions");
        }*/
        assistOS.UI.hideLoading(loaderId);
        return questions;
    }

    getFireCrawlerApiKey() {
        let firecrawlerapikey = this.element.querySelector("#firecrawlerapikey");
        return firecrawlerapikey.value;
    }

    async obtainBibliografy() {
        let loaderId = assistOS.UI.showLoading();
        const personalityObj = await this.getPersonalityObject();
        const llmModule = await require('assistos').loadModule("llm", {});

        const {queries} = this.research;
        let bibliographyUrls = [];
        //let bibliographySummaries = [];
        let fireCrawler = Web.getFireCrawlerInstance(this.getFireCrawlerApiKey(), console);
        for (let query of queries) {
            let prompt = `You are a research assistant. Generate a web query base on a clarifying question and it's answer.` +
                `Generate exactly one web query to search for the target content type ${this.research.contentType} by extracting relevant info from the following: ${query}. Do not add any extra details in your response.`;

            let webQuery = await llmModule.generateText(assistOS.space.id, prompt, personalityObj.id);
            webQuery = webQuery.message;
            let urls = await fireCrawler.search(webQuery, this.research.contentType);
            bibliographyUrls = bibliographyUrls.concat(urls, bibliographyUrls);
            /*for(let url of urls){
                let content = await fireCrawler.scrape(url);
                content = await this.summariseBibliography(content);
                content = content.message;
                bibliographySummaries.push(content);
            }*/
        }

        this.research.bibliographyUrls = bibliographyUrls;
        /*this.research.bibliographySummaries = bibliographySummaries;*/
        assistOS.UI.hideLoading(loaderId);
        /*this.generateReport();*/
        this.validateBibliography();
    }

    async validateBibliography() {
        let urls = "";

        for (let url of this.research.bibliographyUrls) {
            urls += url + "|-|";
        }

        let responseUrls = await assistOS.UI.showModal("validate-urls-modal", {
            "presenter": "validate-urls-modal",
            "urls": urls
        }, true);

        let newUrls = [];
        for (let index of Object.keys(responseUrls.urls)) {
            newUrls.push(responseUrls.urls[index]);
        }
        this.research.bibliographyUrls = newUrls;

        let loaderId = assistOS.UI.showLoading();
        let fireCrawler = Web.getFireCrawlerInstance(this.getFireCrawlerApiKey(), console);
        let bibliographySummaries = [];
        for (let url of newUrls) {
            let content = await fireCrawler.scrape(url);
            content = await this.summariseBibliography(content);
            content = content.message;
            bibliographySummaries.push(content);
        }
        this.research.bibliographySummaries = bibliographySummaries;
        assistOS.UI.hideLoading(loaderId);
        this.generateReport();
    }

    async generateReport() {
        let loaderId = assistOS.UI.showLoading();
        const personalityObj = await this.getPersonalityObject();
        const llmModule = await require('assistos').loadModule("llm", {});

        let prompt = `You are a research assistant. Combine the following summaries into a cohesive and well-structured research report. If possible generate one table per chapter. Summaries: ${this.research.bibliographySummaries}`;
        let report = await llmModule.generateText(assistOS.space.id, prompt, personalityObj.id);

        this.research.report = report.message;
        assistOS.UI.hideLoading(loaderId);
        this.createDocumentForReport();
    }

    async createDocumentForReport() {
        let loaderId = assistOS.UI.showLoading();
        const documentModule = await require('assistos').loadModule("document", {});
        const personalityObj = await this.getPersonalityObject();

        const documentObj = {
            title: `[Research] ${this.research.researchTopic}`,
            type: 'research',
            content: this.research.report,
            abstract: JSON.stringify({
                personality: personalityObj.name,
                topic: this.research.researchTopic,
                timestamp: new Date().toISOString()
            }, null, 2),
            metadata: {
                id: null,  // This will be filled by the system
                title: `[Research] ${this.research.researchTopic}`
            }
        };

        const documentId = await documentModule.addDocument(assistOS.space.id, documentObj);

        const chapterData = {
            title: "Research result",
            idea: `for now just the markdown result`
        };

        const chapterId = await documentModule.addChapter(assistOS.space.id, documentId, chapterData);

        const paragraphObj = {
            text: this.research.report,
            commands: {}
        };

        await documentModule.addParagraph(assistOS.space.id, documentId, chapterId, paragraphObj);

        const bibliographyChapter = {
            title: "Bibliography",
            idea: `for now just the markdown result`
        };
        const bibliographyChapterId = await documentModule.addChapter(assistOS.space.id, documentId, bibliographyChapter);

        const bibliography = {
            commands: {}
        };

        for (let url of this.research.bibliographyUrls) {
            if(typeof url !== "undefined"){
                bibliography.text += url + "\n";
            }
        }

        await documentModule.addParagraph(assistOS.space.id, documentId, bibliographyChapterId, bibliography);

        assistOS.UI.hideLoading(loaderId);
        console.log('Creating research document done!', documentId);
    }

    async summariseBibliography(content, charactersLimit = 1000) {
        const personalityObj = await this.getPersonalityObject();
        const llmModule = await require('assistos').loadModule("llm", {});

        let prompt = `You are a research assistant. Summarize the following content and extract key insights. Content: ${content}. Limit to ${charactersLimit} characters.`;

        let summary = await llmModule.generateText(assistOS.space.id, prompt, personalityObj.id);

        return summary;
    }

    async saveSettings() {
        const input = this.element.querySelector("#firecrawlerapikey");
        let firecrawlerapikey = input.value;
        if (firecrawlerapikey) {
            try {
                await fetch(`${window.location.protocol}//${window.location.host}/putSSOSecret/Demiurge`,
                    {
                        method: "PUT",
                        body: JSON.stringify({secret: firecrawlerapikey}),
                        headers: {"user-id": assistOS.space.id}
                    }
                )
            } catch (err) {
                console.log(err);
            }
        }
    }
}