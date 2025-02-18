export class DefaultPresenter {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        this.invalidate(async () => {
        });
    }

    async beforeRender() {

    }

    async afterRender() {

    }
}