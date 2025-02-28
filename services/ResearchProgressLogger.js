class ResearchProgressLogger {
    constructor() {
        this.currentStep = '';
        this.urlsProcessed = 0;
        this.totalUrls = 0;
    }

    logStep(stepName, stepDetails) {
        this.currentStep = stepName;
        console.log(`\n[Research Progress] [${stepName}] ${stepDetails?stepDetails:""}...`);
    }

    setTotalUrls(count) {
        this.totalUrls = count;
        console.log(`[Research Progress] Total URLs to process: ${count}`);
    }

    incrementProcessedUrl() {
        this.urlsProcessed++;
        console.log(`[Research Progress] ${this.urlsProcessed}/${this.totalUrls} URLs processed.`);
    }
}

export default {
    getInstance: function(){
        return new ResearchProgressLogger();
    }
}