import * as seleniumStandalone from "selenium-standalone";
import { Q, Url } from "./externals";
export declare type WebDriverConfig = seleniumStandalone.InstallOpts & seleniumStandalone.StartOpts;
export declare enum WebDriverType {
    Selenium,
    Chrome,
}
export declare class WebDriver {
    private currentProcess;
    private currentConfig;
    constructor(configOrPath: WebDriverConfig | string);
    /**
     * Gets the current WebDriver config.
     *
     * @return Returns the WebDriver config.
     */
    getConfig(): WebDriverConfig;
    /**
     * Gets the current WebDriver url string.
     *
     * @return Returns the Url.
     */
    getUrlString(): string;
    /**
     * Gets the current WebDriver url.
     *
     * @return Returns the Url.
     */
    getUrl(): Url.Url;
    /**
     * Installs the WebDriver.
     *
     * @return Returns the promise.
     */
    install(): Q.Promise<{}>;
    /**
     * Starts the selenium WebDriver.
     *
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    startSelenium(errorIfStarted?: boolean): Q.Promise<any>;
    /**
     * Starts the chrome driver.
     *
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    startChromeDriver(errorIfStarted?: boolean): Q.Promise<void>;
    /**
     * Installs and starts the specified server.
     *
     * @param serverType The type of server to start.
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    autoStartServer(serverType: WebDriverType, errorIfStarted?: boolean): Q.Promise<any>;
    /**
     * Stops the current WebDriver process.
     *
     * @return Returns the promise.
     */
    stop(): void;
    /**
     * Checks if a WebDriver is started.
     *
     * @return Returns the promise.
     */
    isStarted(): Q.Promise<any>;
    private errorIfStarted(errorIfStarted);
    private getWebDriverStatusUrl();
    private getProcessStartArgByName(name);
    private computeFsPaths();
    private getDefaultConfig();
    private spawnProcess(path, args?);
}
