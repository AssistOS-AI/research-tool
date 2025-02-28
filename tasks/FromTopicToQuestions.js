const NAME = "FromTopicToQuestions";

module.exports = {
    runTask: async function () {
        this.logInfo(`Initializing ${NAME} task...`);
        const llmModule = await this.loadModule("llm");
        const personalityModule = await this.loadModule("personality");
        const utilModule = await this.loadModule("util");
        const documentModule = await this.loadModule("document");

        // Get personality description
        this.logProgress("Fetching personality details...");
        this.logInfo(`Parameters received: ${JSON.stringify(this.parameters)}`);

        const personality = await personalityModule.getPersonality(this.spaceId, this.parameters.personality);
        if (!personality) {
            this.logError("Personality not found by ID");
            throw new Error('Personality not found by ID');
        }

        this.logInfo(`Found personality name: ${personality.name}`);
        const personalityObj = await personalityModule.getPersonalityByName(this.spaceId, personality.name);
        this.logInfo(`Personality object received: ${JSON.stringify(personalityObj)}`);

        if (!personalityObj) {
            this.logError("Personality not found by name");
            throw new Error('Personality not found by name');
        }
        this.logSuccess("Personality details fetched successfully");


        let limit = 5;
        let prompt = `You are a research assistant. Generate ${limit} clarifying questions to refine the research topic. The purpose of the questions is to properly identify the specific areas in which the user has interest to research. Topic: ${this.parameters.researchTopic} `
        let result;
        try {
            console.log("###calling llm module")
            result = await llmModule.generateText(this.spaceId, prompt, personalityObj.id);
            console.log("### received result", result);
        }catch (e) {
            this.logError(e);
            return {
                status: "failed"
            }
        }
        return {
            status: 'completed',
            result: result
        };
    },

    cancelTask: async function () {
        this.logWarning("Task cancelled by user");
    },

    serialize: async function () {
        return {
            taskType: 'FromTopicToQuestions',
            parameters: this.parameters
        };
    },

    getRelevantInfo: async function () {
        return {
            taskType: 'FromTopicToQuestions',
            parameters: this.parameters
        };
    }
};