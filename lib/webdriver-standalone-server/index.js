"use strict";
var seleniumStandalone = require("selenium-standalone");
var externals_1 = require("./externals");
var Helpers_1 = require("./Helpers/Helpers");
(function (WebDriverType) {
    WebDriverType[WebDriverType["Selenium"] = "selenium"] = "Selenium";
    WebDriverType[WebDriverType["Chrome"] = "chrome"] = "Chrome";
})(exports.WebDriverType || (exports.WebDriverType = {}));
var WebDriverType = exports.WebDriverType;
var WebDriver = (function () {
    function WebDriver(configOrPath) {
        this.currentConfig = configOrPath
            ? (externals_1._.isString(configOrPath) ? require(configOrPath) : configOrPath)
            : {};
    }
    /**
     * Gets the current WebDriver config.
     *
     * @return Returns the WebDriver config.
     */
    WebDriver.prototype.getConfig = function () {
        var config = externals_1._.merge(this.getDefaultConfig(), this.currentConfig || {});
        return config;
    };
    /**
     * Gets the current WebDriver url string.
     *
     * @return Returns the Url.
     */
    WebDriver.prototype.getUrlString = function () {
        return externals_1.Url.format({
            protocol: "http",
            hostname: this.getProcessStartArgByName("-host") || "localhost",
            port: this.getProcessStartArgByName("-port")
        });
    };
    /**
     * Gets the current WebDriver url.
     *
     * @return Returns the Url.
     */
    WebDriver.prototype.getUrl = function () {
        return externals_1.Url.parse(this.getUrlString());
    };
    /**
     * Installs the WebDriver.
     *
     * @return Returns the promise.
     */
    WebDriver.prototype.install = function () {
        var _this = this;
        return externals_1.Q.Promise(function (done, fail) {
            seleniumStandalone.install(_this.getConfig(), function (error) {
                if (error) {
                    return fail(error);
                }
                else {
                    return done(null);
                }
            });
        });
    };
    /**
     * Starts the selenium WebDriver.
     *
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    WebDriver.prototype.startSelenium = function (errorIfStarted) {
        var _this = this;
        if (errorIfStarted === void 0) { errorIfStarted = true; }
        return this.isStarted()
            .then(function () { return _this.errorIfStarted(errorIfStarted); }, function (err) { return Helpers_1.Helpers.getJavaVersion()
            .then(function (javaVersion) {
            return externals_1.Q.Promise(function (done, fail) {
                seleniumStandalone.start(_this.getConfig(), function (error, child) {
                    if (error) {
                        return fail(error);
                    }
                    _this.currentProcess = child;
                    console.log("WebDriver has started on " + _this.getUrlString() + "\n");
                    done(undefined);
                });
            });
        }, function (ex) {
            throw new Error("Java Runtime Environment is not installed!");
        }); });
    };
    /**
     * Starts the chrome driver.
     *
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    WebDriver.prototype.startChromeDriver = function (errorIfStarted) {
        var _this = this;
        if (errorIfStarted === void 0) { errorIfStarted = true; }
        return this.isStarted()
            .then(function () { return _this.errorIfStarted(errorIfStarted); }, function (err) {
            var chromeDriverPath = _this.computeFsPaths().chrome.installPath;
            _this.spawnProcess(chromeDriverPath, [
                "--url-base=wd/hub",
                "--port=" + _this.getUrl().port
            ]);
        });
    };
    /**
     * Installs and starts the specified server.
     *
     * @param serverType The type of server to start.
     * @param errorIfStarted Throw the error if the server is already started.
     * @return Returns the promise.
     */
    WebDriver.prototype.autoStartServer = function (serverType, errorIfStarted) {
        var _this = this;
        if (errorIfStarted === void 0) { errorIfStarted = true; }
        return this.isStarted().then(function () { return _this.errorIfStarted(errorIfStarted); }, function () { return _this.install().then(function () {
            switch (serverType) {
                case WebDriverType.Selenium: return _this.startSelenium();
                case WebDriverType.Chrome: return _this.startChromeDriver();
            }
        }); });
    };
    /**
     * Stops the current WebDriver process.
     *
     * @return Returns the promise.
     */
    WebDriver.prototype.stop = function () {
        if (this.currentProcess) {
            this.currentProcess.kill();
            console.log("WebDriver has been stopped.");
        }
    };
    /**
     * Checks if a WebDriver is started.
     *
     * @return Returns the promise.
     */
    WebDriver.prototype.isStarted = function () {
        var _this = this;
        var request = externals_1.Request.defaults({ json: true });
        return externals_1.Q.Promise(function (done, fail) {
            request(_this.getWebDriverStatusUrl(), function (err, res) {
                if (err || res.statusCode !== 200) {
                    fail(err);
                }
                else {
                    done(res);
                }
            });
        });
    };
    WebDriver.prototype.errorIfStarted = function (errorIfStarted) {
        if (errorIfStarted) {
            throw new Error("WebDriver is already started!");
        }
        else {
            console.log("WebDriver is already started on " + this.getUrlString() + "\n");
        }
    };
    WebDriver.prototype.getWebDriverStatusUrl = function () {
        var statusURI = this.getUrlString();
        switch (this.getProcessStartArgByName("-role")) {
            case "hub": return statusURI + "/grid/api/hub";
            //case "node":
            default: return statusURI + "/wd/hub/status";
        }
    };
    WebDriver.prototype.getProcessStartArgByName = function (name) {
        var config = this.getConfig();
        var index = config.seleniumArgs.indexOf(name);
        return index >= 0 ? config.seleniumArgs[index + 1] : undefined;
    };
    WebDriver.prototype.computeFsPaths = function () {
        var computeFsPaths = require(externals_1.Path.join(externals_1.Path.dirname(require.resolve("selenium-standalone")), "lib/compute-fs-paths"));
        var fsPaths = computeFsPaths(this.getConfig());
        return fsPaths;
    };
    WebDriver.prototype.getDefaultConfig = function () {
        var config = externals_1._.cloneDeep(require(externals_1.Path.join(externals_1.Path.dirname(require.resolve("selenium-standalone")), "lib/default-config")));
        config.seleniumArgs = ["-port", 4444],
            config.logger = function (msg) { return console.log(msg); };
        Object.defineProperty(config.drivers, "internet explorer", // we should support "internet explorer" as well as "ie".
        {
            configurable: false,
            enumerable: true,
            get: function () { return this["ie"]; },
            set: function (value) { return this["ie"] = value; }
        });
        return config;
    };
    WebDriver.prototype.spawnProcess = function (path, args) {
        var _this = this;
        if (!this.currentProcess) {
            process.on("exit", function () { return _this.stop(); });
        }
        this.currentProcess = externals_1.child_process.spawn(path, args);
        this.currentProcess.stdout.on("data", function (data) {
            console.log("\n" + data);
        });
        this.currentProcess.stderr.on("data", function (data) {
            console.log("\n" + data);
        });
    };
    return WebDriver;
}());
exports.WebDriver = WebDriver;
