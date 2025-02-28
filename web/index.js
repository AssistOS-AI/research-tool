class Firecrawler {
    constructor(apikey, logger) {
        this.logger = logger;
        this.apikey = apikey;
    }
    async scrape(url, limit=5000) {
        try {
            const options = {
                method: 'POST',
                headers: {Authorization: `Bearer ${this.apikey}`, 'Content-Type': 'application/json'},
                body: `{"url":"${url}","formats":["markdown"],"onlyMainContent":true,"waitFor":0,"mobile":false,"skipTlsVerification":false,"timeout":30000,"removeBase64Images":true,"blockAds":true,"proxy":"basic"}`
            };

            let response = await fetch('https://api.firecrawl.dev/v1/scrape', options)
                .then(response => response.json());

            return response.data.markdown.slice(0, limit);
        } catch (error) {
            this.logger.warn('Skipping URL:', url, 'Error:', error.message);
            return '';
        }
    }

    async search(query, contentType, limit=2) {
        try {
            const options = {
                method: 'POST',
                headers: {Authorization: `Bearer ${this.apikey}`, 'Content-Type': 'application/json'},
                body: `{"query":"${query} ${contentType}","limit":${limit},"timeout":60000}`
            };

            let response = await fetch('https://api.firecrawl.dev/v1/search', options)
                .then(response => response.json());

            return response.data.map(result => result.url);
        } catch (error) {
            this.logger.error('Error searching Firecrawl:', error);
            return [];
        }
    }
}

export default {
    getFireCrawlerInstance: function(apikey, logger){
        return new Firecrawler(apikey, logger);
    }
}

