export class DefaultController {
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