"use strict";
EXPORTED_SYMBOLS.push("misc");
const misc = {
    getBrowserWindows: function misc_getBrowserWindows() {
        let windows = [];
        let wndEnum = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator).getEnumerator("navigator:browser");
        while (wndEnum.hasMoreElements()) {
            windows.push(wndEnum.getNext());
        }
        return windows;
    },
    getTopBrowserWindow: function misc_getTopBrowserWindow() {
        return this.getTopWindowOfType("navigator:browser");
    },
    getTopWindowOfType: function misc_getTopWindowOfType(windowType) {
        let mediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
        return mediator.getMostRecentWindow(windowType);
    },
    hiddenWindows: {
        get appWindow() {
            let hiddenWindow;
            try {
                hiddenWindow = Cc["@mozilla.org/appshell/appShellService;1"].getService(Ci.nsIAppShellService).hiddenDOMWindow;
            } catch (e) {
                Cu.reportError(e);
            }
            if (!hiddenWindow) {
                return null;
            }
            delete this.appWindow;
            return this.appWindow = hiddenWindow;
        },
        getFrame: function misc_getFrame(aFrameId, aFrameURL) {
            if (!aFrameURL || typeof aFrameURL != "string") {
                throw new TypeError("aFrameURL must be a string.");
            }
            let hiddenWindow = this.appWindow;
            if (!hiddenWindow) {
                return null;
            }
            let hiddenDoc = hiddenWindow.document;
            if (!hiddenDoc) {
                return null;
            }
            let url = aFrameURL;
            let id = aFrameId || btoa(url);
            let frameLoader = hiddenDoc.getElementById(id);
            if (!frameLoader) {
                frameLoader = hiddenDoc.createElement("iframe");
                frameLoader.setAttribute("id", id);
                frameLoader.setAttribute("src", url);
                hiddenDoc.documentElement.appendChild(frameLoader);
                let contentWindow = frameLoader.contentWindow;
                if (contentWindow.location != url) {
                    sysutils.sleep(10000, function _checkLocation() {
                        return contentWindow.location != url;
                    });
                }
                if (contentWindow.location != url) {
                    Cu.reportError("Can't get hidden window for \"" + aFrameURL + "\"");
                    return null;
                }
                sysutils.sleep(1000, function _checkReadyState() {
                    return contentWindow.document.readyState === "complete";
                });
            }
            return frameLoader;
        },
        removeFrame: function misc_removeFrame(aFrameId, aFrameURL) {
            if (!aFrameId && !aFrameURL) {
                throw new TypeError("Need frame id or frame url.");
            }
            let hiddenWindow = this.appWindow;
            if (!hiddenWindow) {
                return;
            }
            let hiddenDoc = hiddenWindow.document;
            if (!hiddenDoc) {
                return;
            }
            let id = aFrameId || btoa(aFrameURL);
            let frameLoader = hiddenDoc.getElementById(id);
            if (frameLoader) {
                frameLoader.parentNode.removeChild(frameLoader);
            }
        },
        getWindow: function misc_getWindow(aFrameURL) {
            let frameLoader = this.getFrame(null, aFrameURL);
            return frameLoader && frameLoader.contentWindow || null;
        }
    },
    openWindow: function misc_openWindow(parameters) {
        let window;
        if ("name" in parameters && parameters.name) {
            const WM = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
            if (window = WM.getMostRecentWindow(parameters.name)) {
                window.focus();
                return window;
            }
        }
        let parent;
        let features = parameters.features || "";
        if (features.indexOf("__popup__") != -1) {
            let featuresHash = Object.create(null);
            let addFeature = function (aFeatureString) {
                let [
                    name,
                    value
                ] = aFeatureString.split("=");
                if (name && !(name in featuresHash)) {
                    featuresHash[name] = value;
                }
            };
            features.replace(/(^|,)__popup__($|,)/, "").split(",").forEach(addFeature);
            addFeature("chrome");
            addFeature("dependent=yes");
            if (sysutils.platformInfo.os.name != "windows") {
                addFeature("popup=yes");
            }
            let featuresMod = [];
            for (let [
                        name,
                        value
                    ] in Iterator(featuresHash)) {
                featuresMod.push(name + (value ? "=" + value : ""));
            }
            features = featuresMod.join(",");
            if (!("parent" in parameters)) {
                parent = this.getTopBrowserWindow();
            }
        }
        parent = parent || parameters.parent || null;
        const WW = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
        window = WW.openWindow(parent, parameters.url, parameters.name || "_blank", features, parameters.arguments || undefined);
        window.parameters = parameters;
        return window;
    },
    navigateBrowser: function misc_navigateBrowser(aNavigateData) {
        if (typeof aNavigateData != "object") {
            throw new Error("Navigation data object required.");
        }
        let url = aNavigateData.url;
        let uri = misc.tryCreateFixupURI(url);
        if (!uri) {
            throw new CustomErrors.EArgRange("url", "URL", url);
        }
        url = uri.spec;
        let postData = "postData" in aNavigateData ? aNavigateData.postData : null;
        let referrer = "referrer" in aNavigateData ? aNavigateData.referrer : null;
        let loadInBackground = "loadInBackground" in aNavigateData ? aNavigateData.loadInBackground : false;
        if (typeof loadInBackground !== "boolean") {
            throw new CustomErrors.EArgRange("loadInBackground", "Boolean", loadInBackground);
        }
        if (typeof referrer == "string") {
            try {
                referrer = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(referrer, null, null);
            } catch (e) {
                referrer = null;
            }
        }
        let sourceWindow = aNavigateData.sourceWindow || misc.getTopBrowserWindow();
        if (!sourceWindow) {
            return this.openNewBrowser(url, referrer, postData);
        }
        switch (aNavigateData.target) {
        case "new tab":
            sourceWindow.gBrowser.loadOneTab(url, referrer, null, postData, loadInBackground);
            break;
        case "new window":
            sourceWindow.openNewWindowWith(url, null, postData, false, referrer);
            break;
        default:
            sourceWindow.gBrowser.loadURI(url, referrer, postData, false);
            break;
        }
        return sourceWindow;
    },
    openNewBrowser: function misc_openNewBrowser(url, referrer, postData) {
        let sa = Cc["@mozilla.org/supports-array;1"].createInstance(Ci.nsISupportsArray);
        let wuri = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
        wuri.data = url;
        sa.AppendElement(wuri);
        sa.AppendElement(null);
        sa.AppendElement(referrer);
        sa.AppendElement(postData);
        let allowThirdPartyFixupSupports = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
        allowThirdPartyFixupSupports.data = false;
        sa.AppendElement(allowThirdPartyFixupSupports);
        let windowWatcher = Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher);
        return windowWatcher.openWindow(null, "chrome://browser/content/browser.xul", null, "chrome,dialog=no,all", sa);
    },
    tryCreateFixupURI: function misc_tryCreateFixupURI(aString) {
        let URIFixup = Cc["@mozilla.org/docshell/urifixup;1"].getService(Ci.nsIURIFixup);
        try {
            return URIFixup.createFixupURI(aString, URIFixup.FIXUP_FLAG_NONE);
        } catch (e) {
            return null;
        }
    },
    mapKeysToArray: function misc_mapKeysToArray(map, filter) {
        let arr = Object.keys(map);
        if (filter) {
            arr = arr.filter(function (val) {
                return filter(val);
            });
        }
        return arr;
    },
    mapValsToArray: function misc_mapValsToArray(map, filter) {
        let arr = [];
        for (let [
                    key,
                    val
                ] in Iterator(map)) {
            if (!filter || filter(key)) {
                arr.push(val);
            }
        }
        return arr;
    },
    invertMap: function misc_invertMap(map) {
        let result = {};
        for (let [
                    key,
                    value
                ] in Iterator(map)) {
            result[value] = key;
        }
        return result;
    },
    separateItems: function misc_separateItems(input, check) {
        if (typeof check != "function") {
            throw new CustomErrors.EArgType("check", "Function", check);
        }
        let trueList = [];
        let falseList = [];
        (input || []).forEach(function (item) {
            (check(item) ? trueList : falseList).push(item);
        });
        return [
            trueList,
            falseList
        ];
    },
    get CryptoHash() {
        let CryptoHash = {
            getFromString: function CryptoHash_getFromString(aString, aAlgorithm) {
                return this._binaryToHex(this.getBinaryFromString(aString, aAlgorithm));
            },
            getBinaryFromString: function CryptoHash_getBinaryFromString(aString, aAlgorithm) {
                let hash = this._createHash(aAlgorithm);
                let stream = strutils.utf8Converter.convertToInputStream(aString);
                this._updateHashFromStream(hash, stream);
                return hash.finish(false);
            },
            _createHash: function CryptoHash__createHash(aAlgorithm) {
                let hash = Cc["@mozilla.org/security/hash;1"].createInstance(Ci.nsICryptoHash);
                hash.initWithString(aAlgorithm);
                return hash;
            },
            _binaryToHex: function CryptoHash__binaryToHex(aInput) {
                let hex = [];
                for (let i in aInput) {
                    hex.push(("0" + aInput.charCodeAt(i).toString(16)).slice(-2));
                }
                return hex.join("");
            },
            _updateHashFromStream: function CryptoHash__updateHashFromStream(aHash, aStream) {
                let streamSize = aStream.available();
                if (streamSize) {
                    aHash.updateFromStream(aStream, streamSize);
                }
            }
        };
        delete this.CryptoHash;
        return this.CryptoHash = CryptoHash;
    },
    parseLocale: function misc_parseLocale(localeString) {
        let components = localeString.match(this._localePattern);
        if (components) {
            return {
                language: components[1],
                country: components[3],
                region: components[5]
            };
        }
        return null;
    },
    findBestLocalizedValue: function misc_findBestLocalizedValue(map, forLocale) {
        const lpWeights = {
            language: 32,
            empty: 16,
            en: 8,
            ru: 4,
            country: 2,
            region: 1
        };
        let results = Object.keys(map).map(function (key) {
            let weight = 0;
            if (key) {
                let locale = misc.parseLocale(key);
                for (let partName in lpWeights) {
                    if (partName in locale) {
                        let localePart = locale[partName];
                        if (partName == "language") {
                            if (localePart in lpWeights) {
                                weight += lpWeights[localePart];
                            }
                        }
                        if (localePart === forLocale[partName]) {
                            weight += lpWeights[partName];
                        }
                    }
                }
            } else {
                weight = lpWeights.empty;
            }
            return {
                key: key,
                weight: weight
            };
        });
        results.sort(function rule(a, b) {
            return b.weight - a.weight;
        });
        return results[0] && map[results[0].key];
    },
    _localePattern: /^([a-z]{2})(-([A-Z]{2})(-(\w{2,5}))?)?$/
};
