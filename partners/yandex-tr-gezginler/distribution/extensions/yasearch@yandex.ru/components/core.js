"use strict";
const {
    classes: Cc,
    interfaces: Ci,
    results: Cr,
    utils: Cu
} = Components;
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
let extDir = Services.io.newURI(__URI__, null, null);
const EXTENSION_URI = Services.io.newURI(extDir.resolve(".."), null, null);
Cu.import(EXTENSION_URI.resolve("config.js"));
function Log(libs, rootDir) {
    this._libs = libs;
    this._rootDir = rootDir;
    this._prefs = libs.Preferences;
    const Log4Moz = this._libs.Log4Moz;
    Log4Moz.repository.rootLogger.level = Log4Moz.Level.All;
    this._coreLogger = Log4Moz.repository.getLogger(CB_CONFIG.APP.NAME + ".Core");
    this._coreLogger.level = Log4Moz.Level.Debug;
    this._logAppenders = null;
}
Log.prototype = {
    fatal: function Log_fatal(err, msg) {
        return this._logError("fatal", err, msg);
    },
    error: function Log_error(err, msg) {
        return this._logError("error", err, msg);
    },
    start: function Log_start() {
        this._logAppenders = Log.APPENDERS.map(function (LoggerClass) {
            return new LoggerClass(this._libs, this._rootDir);
        }, this);
        this._logAppenders.forEach(function (logger) {
            for (let prefName in logger.prefs) {
                logger.prefs[prefName](this._prefs.get(prefName, null));
                this._prefs.observe(prefName, this);
            }
        }, this);
    },
    stop: function Log_stop() {
        this._logAppenders.forEach(function (logger) {
            if (logger.prefs) {
                for (let prefName in logger.prefs) {
                    this._prefs.ignore(prefName, this);
                }
            }
            logger.stop();
        }, this);
        this._logAppenders = null;
    },
    observe: function Log_observe(subject, topic, prefName) {
        if (topic == "nsPref:changed") {
            this._logAppenders.forEach(function (logger) {
                if (logger.prefs && logger.prefs[prefName]) {
                    logger.prefs[prefName](this._prefs.get(prefName, null));
                }
            }, this);
        }
    },
    _logError: function Log__logError(level, err, msg) {
        let text = err.name + ": " + (msg ? msg + ";\n" + err.message : err.message);
        let fileName = err.fileName || err.filename;
        if (fileName) {
            text += "\nin " + fileName + "@" + err.lineNumber;
        }
        this._coreLogger[level](text);
        if (err.stack) {
            this._coreLogger.debug(err.stack);
        }
    }
};
Log.getLogLevelHandler = function Log_getLogLevelHandler(appender) {
    return function LogLevelHandler(level) {
        level = parseInt(level, 10);
        level = level >= 0 ? level : 100;
        appender.level = level;
    };
};
Log.getPrefName = function Log_getPrefName(name) {
    return [
        "extensions." + CB_CONFIG.APP.ID,
        "xbcore",
        "logging",
        name
    ].join(".");
};
Log.APPENDERS = [
    function Log_APPENDERS_console(libs) {
        let basicFormatter = new libs.Log4Moz.BasicFormatter();
        let appender = new libs.Log4Moz.ConsoleAppender(basicFormatter);
        let appLogger = libs.Log4Moz.repository.getLogger(CB_CONFIG.APP.NAME);
        appLogger.addAppender(appender);
        this.stop = function Log_APPENDERS_console_stop() {
            appLogger.removeAppender(appender);
        };
        this.prefs = {};
        this.prefs[Log.getPrefName("console.level")] = Log.getLogLevelHandler(appender);
    },
    function Log_APPENDERS_stdout(libs) {
        let appender = new libs.Log4Moz.DumpAppender();
        let rootLogger = libs.Log4Moz.repository.rootLogger;
        rootLogger.addAppender(appender);
        this.stop = function Log_APPENDERS_stdout_stop() {
            rootLogger.removeAppender(appender);
        };
        this.prefs = {};
        this.prefs[Log.getPrefName("stdout.level")] = Log.getLogLevelHandler(appender);
    },
    function Log_APPENDERS_file(libs, rootDir) {
        rootDir.append("debug.log");
        let basicFormatter = new libs.Log4Moz.BasicFormatter();
        let appender = new libs.Log4Moz.RotatingFileAppender(rootDir, basicFormatter);
        let rootLogger = libs.Log4Moz.repository.rootLogger;
        rootLogger.addAppender(appender);
        this.stop = function Log_APPENDERS_file_stop() {
            appender.closeStream();
            rootLogger.removeAppender(appender);
        };
        this.prefs = {};
        this.prefs[Log.getPrefName("file.level")] = Log.getLogLevelHandler(appender);
    },
    function Log_APPENDERS_socket(libs) {
        let xmlFormatter = new libs.Log4Moz.XMLFormatter();
        let rootLogger = libs.Log4Moz.repository.rootLogger;
        let appender = getSocket("localhost:4448");
        this.stop = closeSocket;
        this.prefs = {};
        this.prefs[Log.getPrefName("socket.level")] = Log.getLogLevelHandler(appender);
        this.prefs[Log.getPrefName("socket.address")] = function Log_APPENDERS_socket_pref_address(address) {
            if (address) {
                closeSocket();
                appender = getSocket(address);
            }
        };
        function closeSocket() {
            appender.closeStream();
            rootLogger.removeAppender(appender);
        }
        function getSocket(address) {
            let [
                host,
                port
            ] = address.split(":");
            let appender = new libs.Log4Moz.SocketAppender(host, port, xmlFormatter);
            rootLogger.addAppender(appender);
            return appender;
        }
    },
    function Log_APPENDERS_browserConsole(libs) {
        let logger = libs.Log4Moz.repository.getLogger("Browser.Console");
        logger.level = libs.Log4Moz.Level.Error;
        libs.ConsoleListener.addLogger(logger);
        this.stop = function Log_APPENDERS_browserConsole_stop() {
            libs.ConsoleListener.removeLogger(logger);
        };
    }
];
function CustomBarCore() {
    this._libs = this._moduleFileNames.map(function (fileName) {
        return this._modulesPath + fileName;
    }, this).reduce(function (libs, modulePath) {
        Cu.import(modulePath, libs);
        return libs;
    }, {});
    this._log = new Log(this._libs, this.rootDir);
    Services.obs.addObserver(this, "quit-application", false);
}
CustomBarCore.prototype = {
    get Lib() {
        return this._libs;
    },
    get CONFIG() {
        return CB_CONFIG;
    },
    get appName() {
        return CB_CONFIG.APP.NAME;
    },
    get buildDate() {
        return new Date(this._buildTimeStamp);
    },
    get buidRevision() {
        return CB_CONFIG.BUILD.REVISION;
    },
    get extensionPrefsPath() {
        return "extensions." + CB_CONFIG.APP.ID + ".";
    },
    get nativesPrefsPath() {
        return this.extensionPrefsPath + "native_comps.";
    },
    get staticPrefsPath() {
        return this.extensionPrefsPath + "static.";
    },
    get application() {
        return this._appObj;
    },
    get rootDir() {
        if (!this._appRoot) {
            this._appRoot = Services.dirsvc.get("ProfD", Ci.nsIFile);
            this._appRoot.append(CB_CONFIG.APP.NAME + "-xb");
            if (!this._appRoot.exists()) {
                this._appRoot.create(Ci.nsIFile.DIRECTORY_TYPE, parseInt("0755", 8));
            }
        }
        return this._appRoot.clone();
    },
    get xbProtocol() {
        if (!this._xbProtocol) {
            this._xbProtocol = Cc["@mozilla.org/network/protocol;1?name=xb"].getService(Ci.nsIProtocolHandler).wrappedJSObject;
        }
        return this._xbProtocol;
    },
    get protocols() {
        return this._protocols;
    },
    get extensionURI() {
        return EXTENSION_URI.clone();
    },
    get wrappedJSObject() {
        return this;
    },
    get eventTopics() {
        return this._globalEvents;
    },
    stop: function CustomBarCore_stop() {
        this._log.stop();
    },
    observe: function CustomBarCore_observe(subject, topic) {
        switch (topic) {
        case "profile-after-change":
            this._log.start();
            this._registerProtocols();
            this._initApp();
            break;
        case "quit-application":
            if (this._appObj) {
                this._destroyApp();
            }
            break;
        }
    },
    get oldCore() {
        try {
            let oldCore = "nsIYaSearch" in Ci && Cc["@yandex.ru/" + CB_CONFIG.APP.NAME + ";1"].getService(Ci.nsIYaSearch).wrappedJSObject;
            this.__defineGetter__("oldCore", function () {
                return oldCore;
            });
            return this.oldCore;
        } catch (e) {
        }
        return null;
    },
    _buildTimeStamp: Date.parse(CB_CONFIG.BUILD.DATE),
    _modulesPath: "resource://" + CB_CONFIG.APP.NAME + "-mod/",
    _appResPath: "resource://" + CB_CONFIG.APP.NAME + "-app/",
    _appChromePath: "chrome://" + CB_CONFIG.APP.NAME + "/",
    _appRoot: null,
    _appObj: null,
    _logging: null,
    _globalEvents: {
        EVT_PLUGIN_BEFORE_ENABLED: CB_CONFIG.APP.NAME + "-platform-plugin-before_enabled",
        EVT_PLUGIN_ENABLED: CB_CONFIG.APP.NAME + "-platform-plugin-enabled",
        EVT_PLUGIN_BEFORE_DISABLED: CB_CONFIG.APP.NAME + "-platform-plugin-before_disabled",
        EVT_PLUGIN_DISABLED: CB_CONFIG.APP.NAME + "-platform-plugin-disabled",
        EVT_AFTER_DEFPRESET_UPD: CB_CONFIG.APP.NAME + "-platform-defpreset-after_update",
        EVT_BEFORE_GLOBAL_RESET: CB_CONFIG.APP.NAME + "-platform-components-before_reset",
        EVT_AFTER_GLOBAL_RESET: CB_CONFIG.APP.NAME + "-platform-components-after_reset"
    },
    _moduleFileNames: [
        "Log4Moz.jsm",
        "Preferences.jsm",
        "WindowListener.jsm",
        "AddonManager.jsm",
        "Foundation.jsm",
        "SimpleProtocol.jsm"
    ],
    _initApp: function CustomBarCore__initApp() {
        try {
            let appModule = {};
            Cu.import(this._appResPath + "bar.js", appModule);
            this._appObj = appModule.barApplication;
            this._appObj.init(this);
            Services.obs.notifyObservers(null, CB_CONFIG.APP.NAME + "-state-changed", "custombar-initialized");
        } catch (e) {
            this._appObj = null;
            this._log.fatal(e, "Couldn't initialize application.");
        }
    },
    _destroyApp: function CustomBarCore__destroyApp() {
        this._appObj.finalize(function () {
            this._unregisterProtocols();
            this._log.stop();
            this._appObj = null;
        }.bind(this));
    },
    _registerProtocols: function CustomBarCore__registerProtocols() {
        this._protocols = {};
        for (let [
                    scheme,
                    classID
                ] in Iterator(CB_CONFIG.PROTOCOLS)) {
            this._protocols[scheme] = new this._libs.SimpleProtocol(scheme, classID);
        }
    },
    _unregisterProtocols: function CustomBarCore__unregisterProtocols() {
        for (let [
                    scheme,
                    protocol
                ] in Iterator(this._protocols)) {
            try {
                protocol.unregister();
            } catch (e) {
                this._log.error(e, "Error unregistering '" + scheme + "' protocol.");
            }
        }
        this._protocols = {};
    },
    classDescription: "Custom Yandex bar core JS component for " + CB_CONFIG.APP.NAME,
    classID: Components.ID(CB_CONFIG.CORE.CLASS_ID),
    contractID: CB_CONFIG.CORE.CONTRACT_ID,
    QueryInterface: XPCOMUtils.generateQI([
        Ci.nsISupports,
        Ci.nsIObserver
    ]),
    _xpcom_categories: [{
            category: "app-startup",
            service: true
        }]
};
const NSGetFactory = XPCOMUtils.generateNSGetFactory([CustomBarCore]);
