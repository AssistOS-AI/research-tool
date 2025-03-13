export class ValidateUrlsModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.urls = this.element.getAttribute('data-urls');

        if(typeof this.urls === 'undefined') {
            throw new Error("No urls received");
        }

        if(typeof this.urls === "string"){
            this.urls = this.urls.split("|-|");
            //there is a possibility to obtain empty urls...
            /*for(let i=0; i < this.urls.length; i++){
                let urls = this.urls[i];
                if(!urls || (typeof urls === "string" && urls.trim() === "")) {
                    delete this.urls[i];
                    i=i-1;
                }
            }*/
        }
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.invalidate();

        console.log("constructor called...");
    }

    async beforeRender() {
        console.log("before renderer called");
        this.urlsToRenderer = "";
        for(let index in this.urls){
            let url = this.urls[index];
            if(url.trim()===""){
                continue;
            }
            this.urlsToRenderer +=`<div class="form-group">
                                     <div class="input-wrapper">
                                        <input type="text" name="${index}" value="${url}" required>
                                        <a class="link${index}" href="${url}" target="_blank">Visit</a>
                                        <button class="primary-button update-url-button" index="${index}">
                                            <span class="button-icon">&#10227;</span>
                                            Update
                                        </button>
                                     </div>
                                    </div>`;
        }

        console.log(this.urlsToRenderer);
    }

    async afterRender() {
        this.setupEventListeners();
        document.addEventListener('themechange', this.handleThemeChange.bind(this));
    }

    async closeModal(_target, taskId) {
        await assistOS.UI.closeModal(_target, taskId);
    }

    setupEventListeners() {
        const updateButtons = this.element.querySelectorAll('.update-url-button');

        if (updateButtons) {
            for(let updateBtn of updateButtons){
                updateBtn.addEventListener('click', async (e) => {
                    let target = e.target;
                    let index = target.getAttribute('index');
                    const input = this.element.querySelector(`[name="${index}"]`);
                    const newUrl = input.value;
                    this.element.querySelector(`a.link${index}`).setAttribute("href", newUrl);
                    this.urls[index] = newUrl;
                    e.preventDefault();
                })
            }

        }
        const form = this.element.querySelector('#urlsReview');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.continueResearch(form);
        });
    }

    async continueResearch(){
        const form = this.element.querySelector('#urlsReview');
        const formData = await assistOS.UI.extractFormInformation(form);
        console.log('Form data:', formData.data);

        if (!formData.isValid) {
            console.error('Invalid form data');
            return assistOS.UI.showApplicationError("Invalid form data", "Please fill all the required fields", "error");
        }

        await assistOS.UI.closeModal(this.element, {urls: formData.data});
    }

    handleThemeChange() {
        this.currentTheme = document.documentElement.getAttribute('theme') || 'light';
        this.invalidate();
    }
}