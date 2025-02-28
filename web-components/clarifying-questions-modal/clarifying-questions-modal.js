export class ClarifyingQuestionsModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.questions = this.element.getAttribute('data-questions');

        if(typeof this.questions === 'undefined') {
            throw new Error("No questions received");
        }

        if(typeof this.questions === "string"){
            this.questions = this.questions.split("\n");
            //there is a possibility to obtain empty questions...
            for(let i=0; i< this.questions.length; i++){
                let question = this.questions[i];
                if(!question || (typeof question === "string" && question.trim() === "")) {
                    delete this.questions[i];
                    i=i-1;
                }
            }
        }
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.invalidate();
    }

    async beforeRender() {
        try {
            this.questionsToRender = this.questions.map((question, index) => {
                return `<div class="form-group">
                            <label for="question${index}">${question}</label>
                            <div class="input-wrapper">
                                <input type="text" name="${index}" required>
                                <div class="input-info">Provide a clear and concise answer</div>
                            </div>
                        </div>`;
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
        const form = this.element.querySelector('#questionsForm');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.continueResearch(form);
            });
        }
    }

    async continueResearch(){
        const form = this.element.querySelector('#questionsForm');
        const formData = await assistOS.UI.extractFormInformation(form);
        console.log('Form data:', formData.data);

        if (!formData.isValid) {
            console.error('Invalid form data');
            return assistOS.UI.showApplicationError("Invalid form data", "Please fill all the required fields", "error");
        }

        await assistOS.UI.closeModal(this.element, {questions: this.questions, answers:formData.data});
    }

    handleThemeChange() {
        this.currentTheme = document.documentElement.getAttribute('theme') || 'light';
        this.invalidate();
    }
}