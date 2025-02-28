const applicationModule = require('assistos').loadModule('application', {});
const documentModule = require('assistos').loadModule('document', {});

export class InitResearchModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.invalidate();
    }

    async beforeRender() {
        try {
            let contentTypes = ["academic papers", "blogs", "news articles"];
            this.contentTypeOptions = contentTypes.map(contentType =>
                `<option value="${contentType}">${contentType}</option>`
            ).join('');

            // Load personalities from AssistOS
            const personalityModule = require('assistos').loadModule('personality', {});
            const personalities = await personalityModule.getPersonalitiesMetadata(assistOS.space.id);
            this.personalities = personalities;
            this.personalityOptions = personalities.map(personality => {
                return `<option value="${personality.id}">${personality.name}</option>`;
            });

        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async afterRender() {
        this.setupEventListeners();
        document.addEventListener('themechange', this.handleThemeChange.bind(this));
    }

    async closeModal(_target, taskId) {
        await assistOS.UI.closeModal(_target, taskId);
    }

    setupEventListeners() {
        const form = this.element.querySelector('#researchForm');
        const submitButton = this.element.querySelector('#initResearch');
        submitButton.disabled = true;
        submitButton.style.opacity = '0.6';
        submitButton.style.cursor = 'not-allowed';

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.initResearch(form);
            });

            this.element.addEventListener("change", ()=>{
                const topicInput = this.element.querySelector('#researchTopic');
                let topic = topicInput.value;
                const contentTypeSelect = this.element.querySelector('#content-type');
                let contentType = contentTypeSelect.value;

                let isDisabled = true;
                if (topic && contentType){
                    isDisabled = false;
                }

                submitButton.disabled = isDisabled;
                submitButton.style.opacity = isDisabled ? '0.6' : '1';
                submitButton.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
            });
        }
    }

    async initResearch(){
        const form = this.element.querySelector('#researchForm');
        const formData = await assistOS.UI.extractFormInformation(form);
        console.log('Form data:', formData.data);

        if (!formData.isValid) {
            console.error('Invalid form data');
            return assistOS.UI.showApplicationError("Invalid form data", "Please fill all the required fields", "error");
        }

        await assistOS.UI.closeModal(this.element, formData.data);
    }

    handleThemeChange() {
        this.currentTheme = document.documentElement.getAttribute('theme') || 'light';
        this.invalidate();
    }
}