// -*- indent-tabs-mode: t -*- 
const kCID  = Components.ID('{57f56aca-7338-11dc-8314-0800200c9a66}'); 
const kID   = '@goo.ne.jp/greengoo/startup;1';
const kNAME = "goo Green Label Global Service";

const kEXTENSION_ID = 'greengoo@goo.ne.jp';

const kOVERLAY_STYLE_NAME   = 'greengoo';
const kOVERLAY_STYLE_TARGET = 0; // 0 = all, 1 = specified

const kOVERLAY_STYLE_TARGET_RULES = [
		'chrome://browser/content/.+'
	];
const kOVERLAY_STYLE_TARGET_EXCEPTIONS = [
		'chrome://browser/content/preferences/'
	];

const kPREF_ROOT                = 'extensions.greengoo';
const kPREF_STYLE_ENABLED       = 'extensions.greengoo.style.enabled';
const kPREF_CONFIRM_ENABLED     = 'extensions.greengoo.style.confirm.enabled';
const kPREF_TEXTSHADOW_ENABLED  = 'extensions.greengoo.style.textshadow';

const kMYTHEME_PREF = 'extensions.mytheme.installed';

const kOVERLAY_STYLE_URI = 'chrome://greengoo/content/overlayStyle.xul';
const kBUNDLE_URI        = 'chrome://greengoo/locale/greengoo.properties';

const kCOMPETING_ADDONS = [
		'personas@christopher.beard',
		'greengoo@goo.ne.jp'
	];
const kBASE_THEME = 'classic/1.0';

//--------------------------------------------------------------------------

const kOVERLAY_ATTRIBUTE  = 'global-overlay-style';
const kOVERLAY_TEXTSHADOW = '_textshadow';

const ObserverService = Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);

var WindowWatcher,
	Pref,
	PromptService,
	EM,
	RDF,
	overlayTargetRule,
	overlayTargetException;
	 
function GlobalOverlayStyleService() { 
}
GlobalOverlayStyleService.prototype = {
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'final-ui-startup', false);
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');

				this.init();
				try {
					this.onStartup();
				}
				catch(e) {
				}
				return;

			case 'domwindowopened':
				this.applyTheme(aSubject);
				return;
		}
	},
 
	init : function() 
	{
		WindowWatcher = Components.classes['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Components.interfaces.nsIWindowWatcher);

		Pref = Components.classes['@mozilla.org/preferences;1']
				.getService(Components.interfaces.nsIPrefBranch)
				.QueryInterface(Components.interfaces.nsIPrefBranch2);

		PromptService = Components.classes['@mozilla.org/embedcomp/prompt-service;1']
				.getService(Components.interfaces.nsIPromptService);

		EM = Components.classes['@mozilla.org/extensions/manager;1']
				.getService(Components.interfaces.nsIExtensionManager);

		RDF = Components.classes['@mozilla.org/rdf/rdf-service;1']
				.getService(Components.interfaces.nsIRDFService);

		overlayTargetRule = kOVERLAY_STYLE_TARGET_RULES.length ? new RegExp('('+kOVERLAY_STYLE_TARGET_RULES.join('|')+')') : /./;
		overlayTargetException = kOVERLAY_STYLE_TARGET_EXCEPTIONS.length ? new RegExp('('+kOVERLAY_STYLE_TARGET_EXCEPTIONS.join('|')+')') : /[^\s\S]/;

		WindowWatcher.registerNotification(this);

	},
 
	get bundle() 
	{
		if (!this._bundle) {
			this._bundle = Components.classes['@mozilla.org/intl/stringbundle;1']
						.getService(Components.interfaces.nsIStringBundleService)
						.createBundle(kBUNDLE_URI);
		}
		return this._bundle;
	},
	_bundle : null,
 
	onStartup : function() 
	{
		this.checkCompeting();
	},
 
	get installedIDs()
	{
		var installed = [];
		try {
			installed = Pref.getCharPref(kMYTHEME_PREF).split(',');
		}
		catch(e) {
		}
		if (installed.indexOf(kEXTENSION_ID) < 0) {
			installed.push(kEXTENSION_ID);
			Pref.setCharPref(kMYTHEME_PREF, installed.join(','));
		}
		return installed;
	},
	
	checkCompeting : function() 
	{
		if (!Pref.getBoolPref(kPREF_CONFIRM_ENABLED)) return;

		var theme      = this.checkCompetingTheme();
		var extensions = this.getCompetingExtensions(theme);
		if (!theme && !extensions.length) {
			return;
		}

		var shouldRestart = false;
		var checked = { value : true };

		var title, message, checkLabel;
		if (theme && !extensions.length) {
			title = 'resolve_theme_confliction_title';
			message = 'resolve_theme_confliction_text';
			checkLabel = 'resolve_theme_confliction_check';
		}
		else if (!theme && extensions.length) {
			title = 'resolve_extensions_confliction_title';
			message = 'resolve_extensions_confliction_text';
			checkLabel = 'resolve_extensions_confliction_check';
		}
		else {
			title = 'resolve_all_confliction_title';
			message = 'resolve_all_confliction_text';
			checkLabel = 'resolve_all_confliction_check';
		}

		var buttonsFlag =
				(PromptService.BUTTON_TITLE_YES * PromptService.BUTTON_POS_0) +
				(PromptService.BUTTON_TITLE_NO  * PromptService.BUTTON_POS_1);

		if (PromptService.confirmEx(
				null,
				this.bundle.GetStringFromName(title),
				this.bundle.GetStringFromName(message).replace(/%s/i, extensions.join('\n')),
				buttonsFlag,
				null, null, null,
				this.bundle.GetStringFromName(checkLabel),
				checked
			) == 0) {
			if (theme) {
				Pref.setCharPref('extensions.lastSelectedSkin', kBASE_THEME);
				if (Pref.getBoolPref('extensions.dss.enabled')) {
					Pref.setCharPref('general.skins.selectedSkin', kBASE_THEME);
				}
				else {
					Pref.setBoolPref('extensions.dss.switchPending', true);
					shouldRestart = true;
				}
			}
			if (extensions.length) {
				var ids = [].concat(kCOMPETING_ADDONS, this.installedIDs);
				var done = {};
				for (var i = 0, maxi = ids.length; i < maxi; i++)
				{
					if (!EM.getInstallLocation(ids[i]) ||
						ids[i] == kEXTENSION_ID ||
						ids[i] in done)
						continue;
					EM.disableItem(ids[i]);
					done[ids[i]] = true;
				}
				shouldRestart = true;
			}
		}

		if (!checked.value) {
			Pref.setBoolPref(kPREF_CONFIRM_ENABLED, false);
		}

		if (shouldRestart) {
			this.restart();
		}
	},
	
	checkCompetingTheme : function() 
	{
		if (!Pref.getBoolPref(kPREF_STYLE_ENABLED) ||
			StyleChecker.isBaseThemeSelected()) {
			return false;
		}

		try {
			if (Pref.getCharPref('extensions.lastSelectedSkin') == kBASE_THEME) {
				return false;
			}
		}
		catch(e) {
		}

		return true;
	},
 
	getCompetingExtensions : function(aThemeShouldBeChanged) 
	{
		var items = [];

		if (
			!aThemeShouldBeChanged &&
			(
				!Pref.getBoolPref(kPREF_STYLE_ENABLED) ||
				!StyleChecker.isBaseThemeSelected()
			)
			) {
			return items;
		}

		var ids = [].concat(kCOMPETING_ADDONS, this.installedIDs);
		var done = {};
		for (var i = 0, maxi = ids.length; i < maxi; i++)
		{
			if (!EM.getInstallLocation(ids[i]) ||
				ids[i] in done) {
				continue;
			}
			var item = EM.getItemForID(ids[i]);
			var res  = RDF.GetResource('urn:mozilla:item:'+ids[i]);
			if (ids[i] == kEXTENSION_ID) {
				if (this._getRDFValue(res, "appDisabled") == 'needs-disable' ||
					this._getRDFValue(res, "userDisabled") == 'needs-disable')
					return [];
				continue;
			}
			if (this._getRDFValue(res, "appDisabled") != 'true' &&
				this._getRDFValue(res, "appDisabled") != 'needs-disable' &&
			    this._getRDFValue(res, "userDisabled") != 'true' &&
			    this._getRDFValue(res, "userDisabled") != 'needs-disable') {
				items.push(item.name);
				done[ids[i]] = true;
			}
		}

		return items;
	},
   
	_getRDFValue : function(aResource, aID) 
	{
	    try {
		var uri, datasource, target, iface;
		uri = 'http://www.mozilla.org/2004/em-rdf#' + aID;
		datasource = EM.datasource;
		target = datasource.GetTarget(aResource,
					      RDF.GetResource(uri),
					      true);
		iface = Components.interfaces.nsIRDFLiteral;
		return target.QueryInterface(iface).Value;
	    }
	    catch(e) {
		return undefined;
	    }
	},
   
	restart : function() 
	{
		const startup = Components.classes['@mozilla.org/toolkit/app-startup;1']
						.getService(Components.interfaces.nsIAppStartup);
		startup.quit(startup.eRestart | startup.eAttemptQuit);
	},
 
	applyTheme : function(aWindow) 
	{
		if (aWindow != '[object ChromeWindow]') return;

		aWindow.addEventListener('load', function() {
			aWindow.removeEventListener('load', arguments.callee, false);

			if (
				kOVERLAY_STYLE_TARGET == 1 &&
				(
					!overlayTargetRule.test(aWindow.location.href) ||
					overlayTargetException.test(aWindow.location.href)
				)
				)
				return;

			aWindow.document.loadOverlay(kOVERLAY_STYLE_URI, null);

			var observer = new WindowObserver(aWindow);

			Pref.addObserver(kPREF_ROOT, observer, false);

			observer.observe(null, 'nsPref:changed', kPREF_STYLE_ENABLED);

			aWindow.addEventListener('unload', function() {
				aWindow.removeEventListener('unload', arguments.callee, false);
				Pref.removeObserver(kPREF_ROOT, observer, false);
			}, false);
		}, false);
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 
  
const kOSX_TCOLORS_ATTR = 'titlebarcolor|activetitlebarcolor|inactivetitlebarcolor'.split('|');
const kOSX_TCOLORS_BACKUP = 'titlebarcolors-backup';
const kOSX_UNIFIED_WINDOWS = [
		'chrome://browser/content/browser.xul',
		'chrome://browser/content/pageinfo/pageInfo.xul',
		'chrome://browser/content/places/places.xul',
		'chrome://global/content/console.xul',
		'chrome://mozapps/content/extensions/extensions.xul'
	].join('\n');
 
function WindowObserver(aWindow) { 
	this.window = aWindow;
	this.init();
}
WindowObserver.prototype = {
	
	init : function() 
	{
		this.initUnifiedPrefWindow();
	},
 
	initUnifiedPrefWindow : function() 
	{
		var root = this.window.document.documentElement;
		if (
			!this.isGecko19 ||
			root.localName != 'prefwindow' ||
			!kOSX_TCOLORS_ATTR.some(function(aAttr) {
				return root.getAttribute(aAttr);
			})
			)
			return;

		this.isUnifiedPrefWindow = true;

		var selector = this.window.document.getAnonymousElementByAttribute(root, 'anonid', 'selector');

		var bgBox = this.window.document.createElement('box');
		bgBox.setAttribute('class', 'greengoo-selector-background');
		bgBox.setAttribute('style',
			'width: '+selector.boxObject.width+'px !important;'
		);
		root.appendChild(bgBox);
	},
	isUnifiedPrefWindow : false,
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		if (!this.window.document) return;

		switch (aPrefName)
		{
			case kPREF_STYLE_ENABLED:
			case kPREF_TEXTSHADOW_ENABLED:
				var node = this.window.document.documentElement;
				var color = this.window.getComputedStyle(node, '').backgroundColor;
				if (Pref.getBoolPref(kPREF_STYLE_ENABLED) &&
					StyleChecker.isBaseThemeSelected() &&
					color != 'transparent') {
					node.setAttribute(
						kOVERLAY_ATTRIBUTE,
						kOVERLAY_STYLE_NAME +
						(Pref.getBoolPref(kPREF_TEXTSHADOW_ENABLED) ? ' '+kOVERLAY_TEXTSHADOW : '' ) +
						' gecko1.9-or-later='+(this.isGecko19 ? 'true' : 'false' )
					);

					// for Firefox 3, Mac OS X
					if (
						kOSX_UNIFIED_WINDOWS.indexOf(this.window.location.href) < 0  &&
						!this.isUnifiedPrefWindow &&
						kOSX_TCOLORS_ATTR.some(function(aAttr) {
							return node.getAttribute(aAttr) ? true : false ;
						})
						) {
						if (!node.hasAttribute(kOSX_TCOLORS_BACKUP))
							node.setAttribute(
								kOSX_TCOLORS_BACKUP,
								kOSX_TCOLORS_ATTR.map(function(aAttr) {
									return aAttr+'='+node.getAttribute(aAttr);
								}).join('|')
							);
						kOSX_TCOLORS_ATTR.forEach(function(aAttr) {
							return node.removeAttribute(aAttr);
						});
						this.window.resizeBy(1, 0);
						this.window.resizeBy(-1, 0);
					}
				}
				else {
					node.removeAttribute(kOVERLAY_ATTRIBUTE);

					// for Firefox 3, Mac OS X
					if (node.hasAttribute(kOSX_TCOLORS_BACKUP)) {
						node.getAttribute(kOSX_TCOLORS_BACKUP)
							.split('|')
							.forEach(function(aColor) {
								aColor = aColor.split('=');
								if (aColor[1])
									node.setAttribute(aColor[0], aColor[1]);
							});
						this.window.resizeBy(1, 0);
						this.window.resizeBy(-1, 0);
					}
				}
				return;
		}
	},
 
	get isGecko19()
	{
		const XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
				.getService(Components.interfaces.nsIXULAppInfo);
		var version = XULAppInfo.platformVersion.split('.');
		return parseInt(version[0]) >= 2 || parseInt(version[1]) >= 9;
	}
 
}; 
  
var StyleChecker = { 
	isBaseThemeSelected : function()
	{
		try {
			return Pref.getCharPref('general.skins.selectedSkin') == kBASE_THEME;
		}
		catch(e) {
			return false;
		}
	},
};
 
  
   
var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);

		var catMgr = Components.classes['@mozilla.org/categorymanager;1']
					.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry('app-startup', kNAME, kID, true, true);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		createInstance : function(aOuter, aIID)
		{
			return new GlobalOverlayStyleService();
		}
	},

	canUnload : function(aCompMgr)
	{
		return true;
	}
};

function NSGetModule(aCompMgr, aFileSpec) {
	return gModule;
}
 	
