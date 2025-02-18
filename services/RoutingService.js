const NAME = "research-tool";

export class RoutingService {
    constructor() {
        if (RoutingService.instance) {
            return RoutingService.instance;
        } else {
            RoutingService.instance = this;
            return this;
        }
    }

    async navigateToLocation(locationArray = [], appName) {
        if (locationArray.length === 0 || locationArray[0] === NAME) {
            const pageUrl = `${assistOS.space.id}/${appName}/${NAME}`;
            await assistOS.UI.changeToDynamicPage(NAME, pageUrl);
            return;
        }
        if (locationArray[locationArray.length - 1] !== NAME) {
            console.error(`Invalid URL: URL must end with ${NAME}`);
            return;
        }
        const webComponentName = locationArray[locationArray.length - 1];
        const pageUrl = `${assistOS.space.id}/${appName}/${locationArray.join("/")}`;
        await assistOS.UI.changeToDynamicPage(webComponentName, pageUrl);
    }

    static async navigateInternal(subpageName, presenterParams) {
        try {
            const pageUrl = `${assistOS.space.id}/research-tool/${subpageName}`;
            await assistOS.UI.changeToDynamicPage(subpageName, pageUrl, presenterParams);
        } catch (error) {
            console.error('Navigation error:', error);
            throw error;
        }
    }
}