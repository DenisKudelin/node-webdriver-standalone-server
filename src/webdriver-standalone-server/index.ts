import * as seleniumStandalone from "selenium-standalone";
import {_, Q, Path, Request, child_process, Url} from "./externals";
import {Helpers} from "./Helpers/Helpers";

export declare type WebDriverConfig = seleniumStandalone.InstallOpts & seleniumStandalone.StartOpts;

export enum WebDriverType {
    Selenium = <any>"selenium",
    Chrome = <any>"chrome"
}

export class WebDriver {
    private currentProcess: child_process.ChildProcess;
    private currentConfig: WebDriverConfig;

    constructor(configOrPath: WebDriverConfig | string) {
        this.currentConfig = configOrPath
            ? (_.isString(configOrPath) ? require(<string>configOrPath) : configOrPath)
            : {};
    }

    /**
	 * Gets the current WebDriver config.
     *
     * @return Returns the WebDriver config.
	 */
    public getConfig(): WebDriverConfig {
        let config = _.merge(this.getDefaultConfig(), this.currentConfig || {});
        return config;
    }

    /**
	 * Gets the current WebDriver url string.
     *
     * @return Returns the Url.
	 */
    public getUrlString() {
        return Url.format({
            protocol: "http",
            hostname: this.getProcessStartArgByName("-host") || "localhost",
            port: this.getProcessStartArgByName("-port")
        });
    }

    /**
	 * Gets the current WebDriver url.
     *
     * @return Returns the Url.
	 */
    public getUrl() {
        return Url.parse(this.getUrlString());
    }

    /**
	 * Installs the WebDriver.
     *
     * @return Returns the promise.
	 */
    public install() {
        return Q.Promise((done, fail) => {
            seleniumStandalone.install(<any>this.getConfig(),
                (error) => {
                    if (error) {
                        return fail(error);
                    } else {
                        return done(null);
                    }
                });
        });
    }

    /**
	 * Starts the selenium WebDriver.
     *
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
	 */
    public startSelenium(errorIfStarted: boolean = true) {
        return this.isStarted()
            .then(() => this.errorIfStarted(errorIfStarted),
                  (err) => Helpers.getJavaVersion()
                      .then(javaVersion => {
                          return Q.Promise<any>((done, fail) => {
                              seleniumStandalone.start(<any>this.getConfig(),(error, child) => {
                                  if (error) {
                                      return fail(error);
                                  }

                                  this.currentProcess = child;
                                  console.log("WebDriver has started on " + this.getUrlString() + "\n");
                                  done(undefined);
                              });
                          });
                      }, ex => {
                          throw new Error("Java Runtime Environment is not installed!");
                      })
                  );
    }

    /**
	 * Starts the chrome driver.
     *
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
	 */
    public startChromeDriver(errorIfStarted: boolean = true) {
        return this.isStarted()
            .then(() => this.errorIfStarted(errorIfStarted), (err) => {
                let chromeDriverPath: string = this.computeFsPaths().chrome.installPath;
                this.spawnProcess(chromeDriverPath, [
                    "--url-base=wd/hub",
                    "--port=" + this.getUrl().port
                ]);
            });
    }

    /**
     * Installs and starts the specified server.
     *
     * @param serverType The type of server to start.
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    public autoStartServer(serverType: WebDriverType, errorIfStarted: boolean = true) {
        return this.isStarted().then(() => this.errorIfStarted(errorIfStarted),
            () => this.install().then(() =>{
                switch(serverType) {
                    case WebDriverType.Selenium: return this.startSelenium();
                    case WebDriverType.Chrome: return this.startChromeDriver();
                }
            }));
    }

    /**
     * Stops the current WebDriver process.
     *
     * @return Returns the promise.
     */
    public stop() {
        if(this.currentProcess) {
            this.currentProcess.kill();
            console.log("WebDriver has been stopped.");
        }
    }

    /**
     * Checks if a WebDriver is started.
     *
     * @return Returns the promise.
     */
    public isStarted() {
        let request = Request.defaults({json: true});
        return Q.Promise<any>((done, fail) => {
            request(this.getWebDriverStatusUrl(), (err, res) => {
                if (err || res.statusCode !== 200) {
                    fail(err);
                } else {
                    done(res);
                }
            });
        });
    }

    private errorIfStarted(errorIfStarted: boolean) {
        if(errorIfStarted) {
            throw new Error("WebDriver is already started!");
        } else {
            console.log("WebDriver is already started on " + this.getUrlString() + "\n");
        }
    }

    private getWebDriverStatusUrl(): string {
        var statusURI = this.getUrlString();
        switch (this.getProcessStartArgByName("-role")) {
            case "hub": return statusURI + "/grid/api/hub";
            //case "node":
            default: return statusURI + "/wd/hub/status";
        }
    }

    private getProcessStartArgByName(name: string): any {
        let config = this.getConfig();
        let index = config.seleniumArgs.indexOf(name);
        return index >= 0 ? config.seleniumArgs[index + 1] : undefined;
    }

    private computeFsPaths() {
        let computeFsPaths = require(Path.join(Path.dirname(require.resolve("selenium-standalone")),
            "lib/compute-fs-paths"));
        let fsPaths = computeFsPaths(this.getConfig());
        return fsPaths;
    }

    private getDefaultConfig() {
        let config: WebDriverConfig = _.cloneDeep(require(Path.join(Path.dirname(
            require.resolve("selenium-standalone")), "lib/default-config")));
        config.seleniumArgs = <any[]>["-port", 4444],
        config.logger = (msg) => console.log(msg);
        Object.defineProperty(config.drivers, "internet explorer", // we should support "internet explorer" as well as "ie".
        {
            configurable: false,
            enumerable: true,
            get: function() { return this["ie"]; },
            set: function(value) { return this["ie"] = value; }
        });

        return config;
    }

    private spawnProcess(path: string, args?: string[]) {
        if(!this.currentProcess) {
            process.on("exit", () => this.stop());
        }

        this.currentProcess = child_process.spawn(path, args);
        this.currentProcess.stdout.on("data", (data) => {
            console.log("\n" + data);
        });
        this.currentProcess.stderr.on("data", (data) => {
            console.log("\n" + data);
        });
    }
}