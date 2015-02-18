"use strict";
const EXPORTED_SYMBOLS = ["module"];
var module = function (app, common) {
    const EXPIRY_TIME = 7 * 24 * 60 * 60;
    let exportMgr = null;
    let res = {
        _app: null,
        _config: Object.create(null),
        _updateIntervals: Object.create(null),
        get app() {
            return this._app;
        },
        init: function campaign_campaign_init(application) {
            this._app = application;
            exportMgr = app.commonModule("export");
            exportMgr.init(_handlers);
        },
        finalize: function campaign_campaign_finalize() {
            this._app = null;
            exportMgr = null;
        },
        _onSuccess: function campaign_campaign__onSuccess(aWIID, data) {
            this.app.onUpdate(aWIID);
        },
        _onFail: function campaign_campaign__onFail(aWIID, data) {
            this.app.onUpdate(aWIID);
        },
        configure: function campaign_campaign_configure(aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            if (!this._config[configActionName]) {
                this._config[configActionName] = Object.create(null);
            }
            this._config[configActionName][aName] = aValue;
        },
        getConfigValue: function campaign_campaign_getConfigValue(aName, aValue, aAction) {
            let configActionName = aAction || "_defaults";
            return this._config[configActionName] && this._config[configActionName][aName];
        },
        cleanData: function campaign_campaign_cleanData(aWIID) {
            exportMgr.cleanData(aWIID);
        },
        getUpdateInterval: function campaign_campaign_getUpdateInterval(aWIID, force) {
            if (!this._updateIntervals[aWIID] || force) {
                this._updateIntervals[aWIID] = parseInt(this.app.api.Settings.getValue("update-interval"), 10) * 60;
            }
            return this._updateIntervals[aWIID];
        },
        getLastUpdateTime: function campaign_campaign_getLastUpdateTime(aWIID) {
            return exportMgr.getLastUpdateTime(aWIID);
        },
        getError: function campaign_campaign_getError(aWIID) {
            return exportMgr.getError(aWIID);
        },
        getUserData: function campaign_campaign_getUserData(aWIID, aAction) {
            return exportMgr.getServerData(aWIID, aAction);
        },
        update: function campaign_campaign_update(aWIID, force) {
            exportMgr.update(aWIID, force);
        }
    };
    let _handlers = Object.create(null);
    _handlers._defaults = {
        cacheKeys: function campaign_campaign__handlers_main_cacheKeys() {
            return { login: res.getConfigValue("user") };
        },
        updateInterval: function campaign_campaign__handlers_main_updateInterval(aWIID) {
            return res.getUpdateInterval(aWIID);
        },
        expiryInterval: EXPIRY_TIME,
        errback: function campaign_campaign__handlers_main_errback(aXhr) {
            return { _error: true };
        },
        onSuccess: res._onSuccess.bind(res),
        onFail: res._onFail.bind(res)
    };
    _handlers.main = [
        {
            url: "http://direct.yandex.ru/widget/export?format=xml&bar=1",
            callback: function campaign_campaign__handlers_main_callback(aXhr, aWIID, aAction) {
                let data = {};
                let result = {
                    common: data,
                    _error: false
                };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsXML;
                } catch (e) {
                    result._error = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                result.isAgency = !!xhrData.querySelector("root > agency");
                if (result.isAgency) {
                    return result;
                }
                let campNumber = xhrData.querySelector("root > camps_list > camp");
                data.campNumber = campNumber ? campNumber.getAttribute("cid") : 0;
                return result;
            },
            onSuccess: function campaign_campaign__handlers_main_exportData_onSuccess() {
            }
        },
        {
            url: function campaign_campaign__handlers_main_2nd_url(aWIID) {
                let currentData = res.getUserData(aWIID, "main");
                let url = "http://direct.yandex.ru/widget/export?format=xml&bar=1";
                let campNumber = parseInt(res.app.api.Settings.getValue("campaign", aWIID), 10) || currentData && currentData.common && currentData.common.campNumber || "";
                if (!campNumber) {
                    return null;
                }
                url += "&cid=" + campNumber;
                return url;
            },
            callback: function campaign_campaign__handlers_main_2nd_callback(aXhr, aWIID, aAction) {
                let data = {};
                let result = {
                    spec: data,
                    _error: false
                };
                let xhrData;
                try {
                    xhrData = aXhr && aXhr.contentAsXML;
                } catch (e) {
                    result._error = true;
                    return result;
                }
                if (!xhrData) {
                    return null;
                }
                let currentData = res.getUserData(aWIID, "main");
                let commonData = currentData && currentData.common;
                let errorElement = xhrData.querySelector("root > error");
                if (errorElement) {
                    result._error = true;
                    return result;
                }
                result.isAgency = !!xhrData.querySelector("root > agency");
                if (result.isAgency) {
                    return result;
                }
                data.noCampaigns = true;
                let noCamps = xhrData.querySelector("root > no_campaigns");
                if (!noCamps || parseInt(noCamps.textContent, 10) != 1) {
                    data.noCampaigns = false;
                }
                let campNumber = parseInt(res.app.api.Settings.getValue("campaign", aWIID), 10) || commonData && commonData.campNumber || null;
                let camp = xhrData.querySelector("root > camps_info > camp[cid=\"" + campNumber + "\"]");
                if (camp) {
                    data.campnumber = campNumber;
                    data.sumrest = camp.getAttribute("sum_rest") || null;
                    data.name = camp.getAttribute("name") || "";
                    data.shortname = data.name;
                    if (data.shortname.length > 10) {
                        data.shortname = data.shortname.substr(0, 10) + "…";
                    }
                    data.status = camp.getAttribute("status") || null;
                    data.todayclicks = camp.getAttribute("clicks_today") || null;
                }
                let currency = xhrData.querySelector("root > currency");
                data.currency = currency ? currency.textContent : "";
                return result;
            }
        }
    ];
    return res;
};
