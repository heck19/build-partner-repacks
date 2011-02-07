
var CI=Components.interfaces;var CC=Components.classes;var yahooCC=CC;var yahooCI=CI;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/yprefs.js");loader.loadSubScript("chrome://ytoolbar/content/logger.js");loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/ytb_gradient_generator.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}}
function YahooDomBuilder(){var _self=this;var _mNS="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";var _mImagePath="http://us.i1.yimg.com/us.yimg.com/i/tb/icons/";var domDocument=CC["@mozilla.org/xul/xul-document;1"].createInstance(CI.nsIDOMDocument);var _mDocument=domDocument.implementation.createDocument(_mNS,"overlay",null);var _mGradientGenerator=new YTBGradientGenerator(_mDocument.createElementNS("http://www.w3.org/1999/xhtml","canvas"));var _mToolbarDocument=domDocument.implementation.createDocument(_mNS,"overlay",null);_mToolbarDocument.firstChild.setAttribute("id","toolbar");var _mConfigManager=CC["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);var _mStrings=CC["@mozilla.org/intl/stringbundle;1"].getService(CI.nsIStringBundleService).createBundle("chrome://ytoolbar/locale/ytoolbar.properties");var _mLocalStorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var _mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);var _mSkipAttrs={'id':1,'contextmenu':1,'image':1,'class':1,'tooltiptext':1,'type':1};var _mRightAlignBtns=null;var _mReqBtns=null;var _mBtns=null;var _mCNADom=null;var _mFAVDom=null;function _getStr(name,def){var str=null;if(_mStrings){str=_mStrings.GetStringFromName(name);}
if(!str&&def){return def;}
return str;}
function _collectAlertData(dom){try
{var alert_data=[];var attr=dom.getAttribute("yhash");if(attr!=undefined){if(attr=="")attr="{}";var tokens=yahooUtils.JSON.parse(attr);for(name in tokens){var k=name;var v=tokens[name];k=k.replace(/^\s+|\s+$/g,"");k=k.replace(/^\'|\'$/g,"");if(v!=undefined){v=v.replace(/^\s+|\s+$/g,"");v=v.replace(/^\'|\'$/g,"");}
switch(k){case"alrt":alert_data["alrt"]=v;break;case"alint":alert_data["alint"]=v;break;case"algst":alert_data["algst"]=v;break;default:}
if((v!=undefined)&&(v.indexOf("AE_")!=-1)){if(alert_data["displayElement"]==null){alert_data["displayElement"]=[];}
alert_data["displayElement"].push(k);}}}
if(alert_data["alrt"]!=undefined){if(_mLocalStorage!=null){var alert_array=_mLocalStorage.getObject("alert");if(alert_array!=null){alert_array=alert_array.wrappedJSObject.object;}
if(alert_array==undefined){alert_array=[];}
alert_array.push(alert_data);_mLocalStorage.putObject("alert",new WrapperClass(alert_array));}else{yahooDebug("Yahoo LocalStorage Failed");}}else{}}catch(e){yahooError("Error in _collectAlertData "+e);}}
function _createSplitter(){var splitter=_mToolbarDocument.createElementNS(_mNS,"splitter");splitter.id="yahoo-toolbar-splitter";splitter.setAttribute("resizebefore","grow");splitter.setAttribute("resizeafter","grow");splitter.setAttribute("onmouseup","YahooToolbarBuilder.splitterResize()");splitter.setAttribute("onclick","YahooToolbarBuilder.setSearchboxSize()");return splitter;}
function _buildSearchBox(node){var search=null;var dom=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");dom.setAttribute("class","yahoo-toolbar-searchbox-container");dom.setAttribute("flex","1");dom.setAttribute("minwidth","80");dom.setAttribute("width","180");dom.setAttribute("maxheight","24");dom.setAttribute("align","center");try{var search=_mToolbarDocument.createElementNS(_mNS,"textbox");search.setAttribute("id","yahooToolbarEditBox");search.setAttribute("flex","1");search.setAttribute("align","center");search.setAttribute("yevent",node.func);search.setAttribute("ytrack",node.funcTracking);search.setAttribute("yfunc",node.funcNum);search.setAttribute("newlines","replacewithspaces");search.setAttribute("width",_mConfigManager.getIntValue("search.boxwidth"));var searchHash=yahooUtils.JSON.parse(node.hash);search.setAttribute("ylive",unescape(searchHash.live));search.setAttribute("class","yahoo-toolbar-search-box");search.yselect=true;dom.appendChild(search)}catch(e){yahooError("Error in _buildSearchBox "+e);}
return dom;}
function _buildTicker(node){var dom=null;try{dom=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");dom.setAttribute("flex",1);var ticker=_mToolbarDocument.createElementNS(_mNS,"hbox");ticker.setAttribute("id","yahooToolbarTicker");ticker.setAttribute("yevent",node.func);ticker.setAttribute("ytrack",node.funcTracking);ticker.setAttribute("yfunc",node.funcNum);ticker.setAttribute('onkeyup',"if(event.keyCode == event.DOM_VK_ENTER || event.keyCode == event.DOM_VK_RETURN){ _self.blurred(event, true); yahooButtonHandler(event); }");ticker.setAttribute("width",_mConfigManager.getIntValue("cna.tickerboxwidth"));ticker.setAttribute("flex",1);ticker.setAttribute("yhash",node.hash);dom.appendChild(ticker);}catch(e){yahooError("Error in _buildTicker () "+e);}
return dom;}
function _processStyles(node,dom,hash){if(node.styles.indexOf("NOTEXT")>-1){dom.setAttribute("no_label","true");}
if(node.styles.indexOf("ALWAYSHIDE")>-1||node.id=="yahoo-toolbar-srch_hlt"){dom.setAttribute("hidden",true);}
if(node.id!==null&&node.styles.indexOf("REMOVEONCLICK")>-1){_self.removables[_self.removables.length]=dom;}
if(node.styles.indexOf("HIGHLIGHTICON")>-1&&node.icon){var icon=node.icon;var pos=icon.lastIndexOf(".");icon=icon.substr(0,pos)+"_h"+icon.substr(pos);dom.setAttribute("yicon_h",icon)}
dom.setAttribute("ystyles",node.styles);if(dom.ownerDocument.firstChild&&dom.ownerDocument.firstChild.id=="toolbar"&&node.type!=node.EDITBOX_TYPE&&node.styles.indexOf("NOTOOLTIP")==-1){dom.setAttribute("tooltiptext",unescape(node.name));if(hash.at){var tt="";var tooltip=unescape(hash.at);if(tooltip){tooltip=tooltip.replace(/%2525/g,"");tooltip=tooltip.replace(/%25/g,"");tooltip=tooltip.replace(/%|\$|,/g,"");dom.setAttribute("tooltiptext",tooltip);}}}}
function _prepareSettingsButton(dom){var builder=_mGradientGenerator;dom.setAttribute("no_label","true");dom.setAttribute("bgImage",builder.GROUP_BUTTON_IMAGE_BACKGROUND);dom.setAttribute("bgImageNormal",builder.GROUP_BUTTON_IMAGE_BACKGROUND);dom.setAttribute("bgImageHover",builder.GROUP_BUTTON_IMAGE_BACKGROUND_HOVER);dom.setAttribute("bgImagePress",builder.GROUP_BUTTON_IMAGE_BACKGROUND_HOVER);dom.setAttribute("pressEffect","false");_mRightAlignBtns.appendChild(dom);}
function _prepareGroupButton(dom){var builder=_mGradientGenerator;dom.setAttribute("imageBg",builder.GROUP_BUTTON_IMAGE_BACKGROUND_EXTRA);dom.setAttribute("image_bg_normal_extra",builder.GROUP_BUTTON_IMAGE_BACKGROUND_EXTRA);dom.setAttribute("image_bg_normal_hover",builder.GROUP_BUTTON_IMAGE_BACKGROUND_HOVER);dom.setAttribute("image_bg_normal",builder.GROUP_BUTTON_IMAGE_BACKGROUND);dom.setAttribute("image_right_closed",builder.GROUP_BUTTON_RIGHT_CLOSED);dom.setAttribute("image_right_open",builder.GROUP_BUTTON_RIGHT_OPEN);dom.setAttribute("group_right_style","background:url('"+builder.GROUP_BUTTON_RIGHT_CLOSED+"');cursor:pointer;");dom.setAttribute("grp_bg_style","cursor:pointer;background:url('"+builder.GROUP_BUTTON_MIDDLE+"');padding-right:3px;padding-bottom:2px");dom.setAttribute("group_middle_style","cursor:inherit;background:url('"+builder.GROUP_BUTTON_MIDDLE+"')");dom.setAttribute("group-internal-style","padding-left:2px;padding-right:0px;background:url('"+builder.GROUP_BUTTON_INTERNAL+"')");}
function _prepareNormalButton(dom){var builder=_mGradientGenerator;dom.setAttribute("bgImage","");dom.setAttribute("bgImageNormal","");dom.setAttribute("bgImageHover",builder.NORMAL_BUTTON_HOVER);dom.setAttribute("bgImagePress",builder.NORMAL_BUTTON_PRESS);}
function _setDomFont(dom,value){var fontParams=value.split(";")
for(var idx=0;idx<fontParams.length;idx++){var kv=fontParams[idx].split(":");switch(kv[0]){case"c":dom.style.color=kv[1];break;case"ff":dom.style.fontFamily=kv[1];break;case"fs":dom.style.fontSize=""+(parseInt(kv[1])+2)+"px";break;case"fw":var weight="normal"
if(kv[1]=="b"){weight="bold";}
dom.style.fontWeight=weight;break;}}}
function _processYHash(node,dom,hash){for(name in hash){var value=hash[name];var idx=0;switch(name){case"f_1":case"f_2":case"f_0":case"f":_setDomFont(dom,value);break;case"backn":dom.setAttribute("bgImage",_mImagePath+value);dom.setAttribute("bgImageNormal",_mImagePath+value);break;case"backp":dom.setAttribute("bgImagePress",_mImagePath+value);break;case"backh":dom.setAttribute("bgImageHover",_mImagePath+value);break;case"gedge":dom.style.margin=""+value+"px";break;}}}
function _processBookmarks(node,hash){if(node.id=="yahoo-toolbar-boo"&&hash.bmfeed){_self.bm2Feed=unescape(hash.bmfeed);if(hash.bmfoldersave){yahooDebug("Has bmfoldersave: "+hash.bmfoldersave);_self.bm2FolderSave=unescape(hash.bmfoldersave);}else{yahooDebug("NO bmboldersave");}
if(hash.bmimporturl){_self.bm2FFBMImportUrl=unescape(hash.bmimporturl);yahooDebug("Has bmimporturl: "+hash.bmimporturl);}
yahooDebug("FEED: "+_self.bm2Feed);}
if("yahoo-toolbar-boo_m/boo_m_6/boo_m_6_1"==node.id&&hash.bmimport){if(hash.bmimport){_self.bm2FFBMImportCrumb=unescape(hash.bmimport);yahooDebug("Has bmimport: "+hash.bmimport);}}}
function _createToolbarChild(node,parent,hash){var dom=parent.ownerDocument.createElementNS(_mNS,"toolbarbutton");var popup=null;switch(node.type){case node.BUTTON_TYPE:if(node&&node.id&&node.id.indexOf("yahoo-toolbar-add_")>-1){dom=parent.ownerDocument.createElementNS(_mNS,"menuitem");dom.setAttribute("class","lightning-add-button");}
else if(node&&node.id&&node.id.indexOf("yahoo-toolbar-ecap_grp")>-1){dom=parent.ownerDocument.createElementNS(_mNS,"checkbox");dom.setAttribute("class","lightning-expand-button");}
else
{dom.setAttribute("class","lightning-button");}
break;case node.GROUP_TYPE:if(node.id.indexOf("grp_")>=0){dom=parent.ownerDocument.createElementNS(_mNS,"toolbaritem");dom.setAttribute("maxheight","32");dom.setAttribute("class","yahoo-toolbar-group-button");if(node.id.indexOf("grp_cna")>=0){_mCNADom=dom;_mCNADom.setAttribute("enableCompleteExpansion","false");}else{_mFAVDom=dom;_mFAVDom.setAttribute("enableCompleteExpansion","true");}
_prepareGroupButton(dom);}
break;case node.BUTTONSLIDEOUT_TYPE:if(node.name=="Ticker"){dom=_buildTicker(node);}else{if(node&&node.id&&parent.id.indexOf("yahoo-toolbar-grp_fav")>-1&&hash.ysoid){dom.setAttribute("type","menu-slideout");}}
break;case node.BUTTONMENU_TYPE:case node.MODULE_TYPE:case node.MODULEMENU_TYPE:dom.setAttribute("type","menu-button");popup=dom.appendChild(parent.ownerDocument.createElementNS(_mNS,"menupopup"));break;case node.MENU_TYPE:dom.setAttribute("type","menu");popup=dom.appendChild(parent.ownerDocument.createElementNS(_mNS,"menupopup"));break;case node.MENUITEM_TYPE:break;case node.EDITBOX_TYPE:dom=_buildSearchBox(node);break;case node.SEPARATOR_TYPE:dom=null;dom=parent.ownerDocument.createElementNS(_mNS,"toolbarseparator");dom.setAttribute("hidden","true");break;default:dom=null;}
return{domNode:dom,popupNode:popup};}
function _createNonToolbarChild(node,parent){var dom=parent.ownerDocument.createElementNS(_mNS,"menuitem");var popup=null;switch(node.type){case node.MENUITEM_TYPE:case node.BUTTON_TYPE:case node.BUTTONSLIDEOUT_TYPE:case node.GROUP_TYPE:break;case node.BUTTONMENU_TYPE:case node.MENU_TYPE:case node.MODULE_TYPE:case node.MODULEMENU_TYPE:dom=parent.ownerDocument.createElementNS(_mNS,"menu");popup=dom.appendChild(parent.ownerDocument.createElementNS(_mNS,"menupopup"));break;case node.SEPARATOR_TYPE:dom=parent.ownerDocument.createElementNS(_mNS,"menuseparator");break;case node.EDITBOX_TYPE:dom=null;default:dom=null;}
return{domNode:dom,popupNode:popup};}
function _createMenuDom(node,dom){var mdom=null,mpopup=null;var _filter="yahoo-toolbar-srch_ebox,yahoo-toolbar-vsrch,yahoo-toolbar-grp_fav,yahoo-toolbar-pres,yahoo-toolbar-spr";if(_filter.indexOf(node.id)==-1&&node.id.indexOf("ult")==-1){switch(dom.nodeName){case"toolbarbutton":switch(dom.getAttribute("type")){case"menu-button":mdom=_mDocument.createElementNS(_mNS,"menu");mpopup=mdom.appendChild(_mDocument.createElementNS(_mNS,"menupopup"));mdom.setAttribute("label",node.name);if(node.id){mdom.setAttribute("id","menu_"+node.id);}
mdom=mpopup.appendChild(_mDocument.createElementNS(_mNS,"menuitem"));mpopup.appendChild(_mDocument.createElementNS(_mNS,"menuseparator"));break;case"menu":mdom=_mDocument.createElementNS(_mNS,"menu");mpopup=mdom.appendChild(_mDocument.createElementNS(_mNS,"menupopup"));break;default:mdom=_mDocument.createElementNS(_mNS,"menuitem");}
if(node.styles.indexOf("ALWAYSHIDE")>-1){mdom.setAttribute("hidden","true");}
break;case"toolbarseparator":mdom=_mDocument.createElementNS(_mNS,"menuseparator");break;}}
return{mdomNode:mdom,mpopupNode:mpopup};}
function _prepareMenuDom(node,mdom,mpopup,dom,popup){if(node.id){if(node.type==node.BUTTONMENU_TYPE){mdom.setAttribute("id","menu_"+node.id+"_btn");}else{mdom.setAttribute("id","menu_"+node.id);}}
mdom.removeAttribute("class");mdom.removeAttribute("contextmenu");mdom.removeAttribute("tooltiptext");mdom.setAttribute("class","menuitem-iconic");mdom.style.display=dom.style.display;if(node.type==node.BUTTONMENU_TYPE||node.type==node.MODULE_TYPE||node.type==node.MODULEMENU_TYPE){mdom=mpopup.parentNode;}
if(node.id&&node.styles.indexOf("REMOVEONCLICK")>-1){_self.removables[_self.removables.length]=dom;}
if(node.parentNode&&node.parentNode.domMenubar){node.parentNode.domMenubar.appendChild(mdom);}else{_self.menubar.appendChild(mdom);}
node.domMenubar=mpopup||mdom;}
function _iWantToDoAWorkAround(node,dom,hash){if(node.id=="yahoo-toolbar-rss"||node.id=="yahoo-toolbar-rss_m"||node.id=="yahoo-toolbar-RSS"||node.id=="menu_yahoo-toolbar-rss"||node.id=="menu_yahoo-toolbar-rss_m"||node.id=="menu_yahoo-toolbar-RSS"){dom.style.display="none";}
if(node.id=="yahoo-toolbar-cm-sio"){dom.setAttribute("type","checkbox");}
if(dom.parentNode==_mFAVDom&&dom.setAttribute&&!hash.ysoid&&!hash.ysoxx){dom.setAttribute("imgHeight","16");dom.setAttribute("imgWidth","16");}
if(node.id=="yahoo-toolbar-pres"){_prepareSettingsButton(dom);}
if(dom.tagName=="toolbarbutton"){dom.setAttribute("class","lightning-button");}
if(dom.getAttribute("id").indexOf("group")==-1&&dom.getAttribute("id").indexOf("grp")==-1){}
if(_self.iconsOnly===true){}
if(node.icon!==null&&node.icon!==""){dom.setAttribute("yicon",node.icon);_mFileIO.fetchNCacheImage(node.icon,dom);if(dom.tagName=="menuitem"){dom.className+=" menuitem-iconic";}else if(dom.tagName=="menu"){dom.className+=" menu-iconic";}}
else if(node.icon===null||node.icon===""){}
if(node.id=="yahoo-toolbar-yma_m"){var img="alert1.gif";if(hash!=undefined&&hash.ovimg){img=hash.ovimg;}
var path=node.icon;var pos=path.lastIndexOf("/");if(pos>10){path=path.substr(0,pos+1);}else{path="http:\/\/us.i1.yimg.com/us.yimg.com/i/tb/iconsgif/";}
dom.setAttribute("ovimg",path+img);}}
function _setDirectDomAttributes(node,dom){dom.setAttribute("id",node.id);dom.setAttribute("label",node.name);dom.setAttribute("yhash",node.hash);if(node.type==node.BUTTON_TYPE||node.type==node.MENUITEM_TYPE||node.type==node.BUTTONMENU_TYPE||node.type==node.BUTTONSLIDEOUT_TYPE||node.type==node.MODULE_TYPE||node.type==node.MODULEMENU_TYPE||node.type==node.GROUP_TYPE){if(!dom.hasAttribute("oncommand")){dom.setAttribute("oncommand","yahooButtonHandler(event);");if(!(dom.tagName=="menuitem"||dom.tagName=="menu")){dom.setAttribute("onclick","if(event.button == 1) yahooButtonHandler(event);");}}
if(node&&node.id&&node.id.indexOf("yahoo-toolbar-add_")!=-1){dom.setAttribute("onclick","yahooButtonHandler(event);");}
dom.setAttribute("yevent",node.func);dom.setAttribute("ytrack",node.funcTracking);dom.setAttribute("yfunc",node.funcNum);if(node.funcUrl!==null&&node.funcUrl!==""){var url=node.funcUrl;if((url.match("%")!==null)&&(url.match("$")!==null)){var prefs=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);var pc=_mConfigManager.getCharValue("toolbar.pc")||"";var cc=_mConfigManager.getCharValue("installer.country")+"."||"us.";var lang=_mConfigManager.getCharValue("installer.language")||cc.substr(0,2);var cver=_mConfigManager.getCharValue("installer.version")||"1.1.0";url=url.replace("%","");url=url.replace(",$FSRV,%",_mLocalStorage.getString("yahoo.ytff.dataserver.url"));url=url.replace(",$ESRV,%",_mLocalStorage.getString("yahoo.ytff.configserver.url"));url=url.replace(",$LANG,%",lang);url=url.replace(",$REG_pc,%",pc);url=url.replace(",$CVER,%",cver);}
dom.setAttribute('yurl',url);}}}
function _getParent(node,parent,hash){var toolbar=false;if(parent===null){parent=_self.toolbar;toolbar=true;if(node.id=="yahoo-toolbar-cm"){parent=_self.toolar_context;toolbar=false;}else if(node.id=="yahoo-toolbar-rmc_m"){parent=_self.page_context;toolbar=false;}else if(node.id=="yahoo-toolbar-acs"){_self.menubarExtra.appendChild(_mDocument.createElementNS(_mNS,"menuseparator"));return _self.menubarExtra;}else{if(_mBtns.childNodes.length>0){parent=_mBtns;if(hash.grp=="grp_cna"){parent=_mCNADom;}else if(_mFAVDom!=null){parent=_mFAVDom;}}else if(node.type==node.SEPARATOR_TYPE||(_mReqBtns.lastChild&&_mReqBtns.lastChild.nodeName=="toolbarseparator")){parent=_mBtns;}else if(node.id&&node.id.indexOf("yahoo-toolbar-pres")>-1){parent=_mRightAlignBtns;}else
{parent=_mReqBtns;}}}else if(parent==_self.alerts){toolbar=true;}
return{isToolbar:toolbar,parentNode:parent};}
this.toolbar=null;this.menubar=null;this.toolar_context=null;this.page_context=null;this.removables=[];this.bookmarks=null;this.bm2Feed=null;this.bm2Usage=[];this.bm2Prefs=[];this.bm2FolderSave=null;this.bm2FFBMImportCrumb=null;this.bm2FFBMImportUrl=null;this.iconsOnly=false;this.addNode=function(node,parent){var dom,popup;try{node.name=unescape(node.name);if(node.hash=="")node.hash="{}";var hash=yahooUtils.JSON.parse(node.hash);try{if(node.id){var id=node.id;if(id.indexOf("yahoo-toolbar-")==0){id=id.substr(14);}
_mLocalStorage.putObject(node.id+".yhash",new WrapperClass(hash));}}catch(e){yahooError(e);}
var result=_getParent(node,parent,hash);parent=result.parentNode;var product={domNode:null,popupNode:null};if(result.isToolbar){product=_createToolbarChild(node,parent,hash);}else{product=_createNonToolbarChild(node,parent);}
dom=product.domNode;popup=product.popupNode;if(dom==null){return null;}
if(parent==_mFAVDom){_prepareNormalButton(dom);}
_setDirectDomAttributes(node,dom);_processYHash(node,dom,hash);_processBookmarks(node,hash);if(dom.ownerDocument.firstChild&&dom.ownerDocument.firstChild.id=="toolbar"&&node.funcNum=="1"&&parent.parentNode&&parent.parentNode.id!="yahoo-toolbar-boo"){parent.parentNode.setAttribute("id","yahoo-toolbar-bookmarks-"+(node.funcTracking||1));}
parent.appendChild(dom);_processStyles(node,dom,hash);_iWantToDoAWorkAround(node,dom,hash);if(dom.ownerDocument.firstChild&&dom.ownerDocument.firstChild.id=="toolbar"){dom.setAttribute("contextmenu","yahoo-toolbar-context");}
var _skip="yahoo-toolbar-add_grp_fav,yahoo-toolbar-ecap_grp_fav";if(dom.ownerDocument.firstChild&&dom.ownerDocument.firstChild.id=="toolbar"){var mdom,mpopup;if(node.id&&(node.id.indexOf("yahoo-toolbar-ult")>-1||_skip.indexOf(node.id)>-1)){}
else if(dom.nodeName.indexOf("toolbar")===0){product=_createMenuDom(node,dom);mdom=product.mdomNode;mpopup=product.mpopupNode;if(mdom){var attr;for(var i=0;i<dom.attributes.length;i++){attr=dom.attributes[i];if(_mSkipAttrs[attr.name]!=1){mdom.setAttribute(attr.name,attr.value);}}}}
else{mdom=_mDocument.createElementNS(_mNS,dom.nodeName);if(dom.nodeName==="menu"){mpopup=mdom.appendChild(_mDocument.createElementNS(_mNS,"menupopup"));}
for(var idx=0;idx<dom.attributes.length;idx++){attr=dom.attributes[idx];mdom.setAttribute(attr.name,attr.value);}
if(popup){mpopup=mdom.firstChild;}}
if(mdom){_prepareMenuDom(node,mdom,mpopup,dom,popup);}}}catch(e){yahooError(e);}
if(popup){if(dom){try{popup.setAttribute("yhash",dom.getAttribute("yhash"));}catch(e){yahooError(e);}}
dom=popup;}
if(dom!=null){_collectAlertData(dom);}
mdom=null;mpopup=null;popup=null;node=null;return dom;}
this.clear=function(){try{_self.removables=[];_self.toolbar=null;_self.menubar=null;_self.menubarExtra=null;_self.toolar_context=null;_self.page_context=null;_self.alerts=null;_mCNADom=null;_mFAVDom=null;_mReqBtns=null;_mBtns=null;_mRightAlignBtns=null;_self.toolbar=_mToolbarDocument.createDocumentFragment();_self.menubar=_mDocument.createDocumentFragment();_self.menubarExtra=_mDocument.createDocumentFragment();_self.toolar_context=_mDocument.createDocumentFragment();_self.page_context=_mDocument.createDocumentFragment();_self.alerts=_mDocument.createDocumentFragment();_mReqBtns=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");_mReqBtns.id="yahoo-toolbar-reqbtns";_mReqBtns.setAttribute("maxwidth","700");_mReqBtns.setAttribute("pack","begin");_mReqBtns.setAttribute("align","center");_mBtns=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");_mBtns.id="yahoo-toolbar-btns";_mBtns.setAttribute("style","margin-left:5px");_mBtns.setAttribute("maxheight","32");_mRightAlignBtns=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");_mRightAlignBtns.id="yahoo-toolbar-right-btns";_mRightAlignBtns.setAttribute("align","right");var url=_mGradientGenerator.TOOLBAR_BACKGROUND;var tbStyle="background:url('"+url+"');padding:0px !important;margin:0px!important;border:none ! important";var flexBox=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");flexBox.id="yahoo-toolbar-flexbox";flexBox.setAttribute("flex","10");var moreMenu=_mToolbarDocument.createElementNS(_mNS,"toolbarbutton");moreMenu.setAttribute("class","yahoo-toolbar-more-menu-class");moreMenu.id="yahoo-toolbar-moremenu";moreMenu.setAttribute("hidden","true");moreMenu.setAttribute("maxwidth","20");moreMenu.setAttribute("minwidth","20");moreMenu.setAttribute("type","menu");var container=_mToolbarDocument.createElementNS(_mNS,"toolbaritem");container.id="yahoo-toolbar-main-container";var splitter=_createSplitter();container.setAttribute("maxheight","32");container.setAttribute("flex","2");container.setAttribute("style","margin-right:3px;margin-left:3px");container.appendChild(_mReqBtns);container.appendChild(splitter);container.appendChild(_mBtns);container.appendChild(flexBox);container.appendChild(moreMenu);container.appendChild(_mRightAlignBtns);_self.toolbar.appendChild(container);}catch(e){yahooError(e);}};this.remove=function(id){try{var nId;for(var i=0;i<_self.removables.length;i++){if(_self.removables[i]&&_self.removables[i].parentNode&&(_self.removables[i].id==id||_self.removables[i].id=="menu_"+id||_self.removables[i].id=="menu_"
+id+"_btn")){_self.removables[i].parentNode.removeChild(_self.removables[i]);_self.removables[i]=null;}}}catch(e){yahooError(e);}};this.clearBM2=function(){try{_self.bookmarks=null;_self.bookmarks=_mDocument.createDocumentFragment();}catch(e){yahooError(e);}};this.buildBM2=function(dom,parent){var recursionBase=(parent===null);var yahooStr=_mLocalStorage.getObject("yahoo-toolbar-boo.yhash");try{if(!parent){parent=_self.bookmarks;}
var uni=CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);uni.charset="utf-8";var node,name,type,url,menu,menupopup,menuitem,str;for(var i=0;i<dom.childNodes.length;i++){node=dom.childNodes[i];if(node.nodeName!="outline"){continue;}
type=node.getAttribute("type");url=node.getAttribute("u");name=uni.ConvertToUnicode(node.getAttribute("text"));name=unescape(name);switch(type){case"F":if(node.getAttribute("text")=="root"&&node.parentNode&&node.parentNode.getAttribute("type")=="ResultSet"){_self.buildBM2(node,parent);}
else if(node.getAttribute("text")=="tags"&&_self.bm2Prefs.DisplayFoldersAs=="TagView"&&node.getAttribute("fid")=="-1"){_self.buildBM2(node,parent);}else{menu=_mDocument.createElementNS(_mNS,"menu");menu.setAttribute("crop","end");menu.setAttribute("label",name);menu.setAttribute("tooltiptext",name);menu.setAttribute("onclick","if(event.button == 1) {yahooBookmarksOpenAll(_self.firstChild); yahooButtonHandler(event);}");menu.setAttribute("maxwidth","300px");if(_self.bm2Prefs.DisplayFoldersAs=="TagView"){menu.setAttribute("class","menu-iconic");menu.setAttribute("image","chrome://ytoolbar/skin/tag.gif");}else{menu.setAttribute("class","menu-iconic folder-item");}
menupopup=_mDocument.createElementNS(_mNS,"menupopup");if(_self.bm2FolderSave){var nameStr=name.replace(/\$/g,"$$$$");if(yahooStr!==null){str=yahooStr.wrappedJSObject.object["yahoo.bm.folder.add"].replace("__TITLE__",nameStr);}else{str="Add page to __TITLE__";str=str.replace("__TITLE__",nameStr);}
menuitem=_mDocument.createElementNS(_mNS,"menuitem");menuitem.setAttribute("crop","end");menuitem.setAttribute("label",str);menuitem.setAttribute("tooltiptext",str);menupopup.appendChild(menuitem);menupopup.appendChild(_mDocument.createElementNS(_mNS,"menuseparator"));var func=_self.bm2FolderSave;menuitem.setAttribute("yevent",_self.bm2FolderSave.replace("__FOLDERID__",node.getAttribute("fid")));menuitem.setAttribute("yhash","'id':'boo2_m/fold_add'");menuitem.setAttribute("oncommand","yahooButtonHandler(event);");menuitem.setAttribute("onclick","if(event.button == 1) yahooButtonHandler(event);");}
_self.buildBM2(node,menupopup);var nodeB=menupopup.firstChild;var urlYes=0;while(nodeB){if(nodeB.getAttribute("yurl")&&nodeB.getAttribute("yurl")){urlYes++;}
nodeB=nodeB.nextSibling;}
if(urlYes>=1){var nameStr=name.replace(/\$/g,"$$$$");if(yahooStr!==null){str=yahooStr.wrappedJSObject.object["yahoo.bm.folder.open"];}else{str="Open in Tabs";}
menupopup.appendChild(_mDocument.createElementNS(_mNS,"menuseparator"));menuitem=_mDocument.createElementNS(_mNS,"menuitem");menuitem.setAttribute("crop","end");menuitem.setAttribute("label",str);menuitem.setAttribute("tooltiptext",str);menuitem.setAttribute("yhash","'id':'boo2_m/fold_tabs'");menuitem.setAttribute("oncommand","yahooBookmarksOpenAll(this.parentNode); yahooButtonHandler(event);");menuitem.setAttribute("onclick","if(event.button == 1) {yahooBookmarksOpenAll(this.parentNode); yahooButtonHandler(event);}");menuitem.setAttribute("maxwidth","300px");menupopup.appendChild(menuitem);}
if(menupopup.childNodes.length<=2){menupopup.removeChild(menupopup.childNodes[1]);}
menu.appendChild(menupopup);parent.appendChild(menu);}
break;case"B":if((node.parentNode.getAttribute("type")=="RecentSave"||node.parentNode.getAttribute("type")=="FrequentUse")&&((node.parentNode.getAttribute("type")==_self.bm2Prefs.OrderBy&&parent.childNodes.length
-1==_self.bm2Prefs.ToolbarDisplay)||parent.childNodes.length==_self.bm2Prefs.ToolbarDisplay)){break;}
menuitem=_mDocument.createElementNS(_mNS,"menuitem");menuitem.setAttribute("crop","end");menuitem.setAttribute("label",name);menuitem.setAttribute("value",node.getAttribute("u"));menuitem.setAttribute("contextmenu","yahoo-toolbar-context");menuitem.setAttribute("tooltiptext",name);url=url.replace(/,/g,"%2C");menuitem.setAttribute("yevent",",4,boo_m,%"+url);menuitem.setAttribute("ytrack","boo_m");menuitem.setAttribute("yfunc","4");menuitem.setAttribute('yurl',url);menuitem.setAttribute('ybid',node.getAttribute("bid"));menuitem.setAttribute("oncommand","yahooButtonHandler(event);");menuitem.setAttribute("onclick","if(event.button == 1) yahooButtonHandler(event);");menuitem.setAttribute("class","menuitem-iconic bookmark-item");if((_self.bm2Prefs.OrderBy=="RecentlySaved"&&node.parentNode.getAttribute("type")=="RecentSave")||(_self.bm2Prefs.OrderBy=="FrequentlyAccessed"&&node.parentNode.getAttribute("type")=="FrequentUse")){_mFileIO.fetchNCacheFavicon(url,menuitem);}else{var bImage=_mFileIO.getFaviconFromCache(url,true);menuitem.setAttribute("image",bImage);}
parent.appendChild(menuitem);break;case"Toolbar":var d;for(var n=0;n<node.childNodes.length;n++){d=node.childNodes[n];if(d.nodeName=="outline"&&d.getAttribute("type")=="Pref"){_self.bm2Prefs[d.getAttribute("text")]=d.getAttribute("a");}}
break;case"RecentSave":if((_self.bm2Prefs.ToolbarDisplay-1)===0||node.getAttribute("total")=="0"){break;}
var recent;if(yahooStr!==null){recent=yahooStr.wrappedJSObject.object["yahoo.bm.quick.recent"];}else{recent="Recently Saved";}
if(_self.bm2Prefs.OrderBy=="RecentlySaved"){var frag=_mDocument.createDocumentFragment();frag.appendChild(_mDocument.createElementNS(_mNS,"menuitem"));frag.lastChild.setAttribute("label",recent);frag.lastChild.setAttribute("tooltiptext",recent);frag.lastChild.style.fontWeight="bold";frag.lastChild.setAttribute("disabled","true");frag.lastChild.style.color="black";_self.buildBM2(node,frag);var sep=_mDocument.createElementNS(_mNS,"menuseparator");sep.setAttribute("id","yahoo-bookmarks-quickaccess-separator");if(parent.qaFolder){parent.insertBefore(frag,parent.qaFolder);parent.insertBefore(sep,parent.qaFolder);parent.qaFolder=null;}else{parent.appendChild(frag);parent.appendChild(sep);}}
else{menu=_mDocument.createElementNS(_mNS,"menu");menu.setAttribute("id","yahoo-bookmarks-quickaccess-folder");menu.setAttribute("label",recent);menu.setAttribute("tooltiptext",recent);if(_self.bm2Prefs.DisplayFoldersAs=="TagView"){menu.setAttribute("class","menu-iconic");menu.setAttribute("image","chrome://ytoolbar/skin/tag.gif");}else{menu.setAttribute("class","menu-iconic folder-item");}
menupopup=_mDocument.createElementNS(_mNS,"menupopup");_self.buildBM2(node,menupopup);menu.appendChild(menupopup);parent.appendChild(menu);parent.qaFolder=menu;}
break;case"FrequentUse":var frequent;if(yahooStr!==null){frequent=yahooStr.wrappedJSObject.object["yahoo.bm.quick.frequent"];}else{frequent="Quick List";}
if((_self.bm2Prefs.ToolbarDisplay-1)==0||node.getAttribute("total")==="0"){break;}
if(_self.bm2Prefs.OrderBy==="FrequentlyAccessed"){var frag=_mDocument.createDocumentFragment();frag.appendChild(_mDocument.createElementNS(_mNS,"menuitem"));frag.lastChild.setAttribute("label",frequent);frag.lastChild.setAttribute("tooltiptext",frequent);frag.lastChild.style.fontWeight="bold";frag.lastChild.setAttribute("disabled","true");frag.lastChild.style.color="black";_self.buildBM2(node,frag);var sep=_mDocument.createElementNS(_mNS,"menuseparator");sep.setAttribute("id","yahoo-bookmarks-quickaccess-separator");if(parent.qaFolder){parent.insertBefore(frag,parent.qaFolder);parent.insertBefore(sep,parent.qaFolder);parent.qaFolder=null;}else{parent.appendChild(frag);parent.appendChild(sep);}}
else{menu=_mDocument.createElementNS(_mNS,"menu");menu.setAttribute("id","yahoo-bookmarks-quickaccess-folder");menu.setAttribute("label",frequent);menu.setAttribute("tooltiptext",frequent);if(_self.bm2Prefs.DisplayFoldersAs=="TagView"){menu.setAttribute("class","menu-iconic");menu.setAttribute("image","chrome://ytoolbar/skin/tag.gif");}else{menu.setAttribute("class","menu-iconic folder-item");}
menupopup=_mDocument.createElementNS(_mNS,"menupopup");_self.buildBM2(node,menupopup);menu.appendChild(menupopup);parent.appendChild(menu);parent.qaFolder=menu;}
break;}}
uni=null;}catch(e){yahooError(e);}
if(recursionBase&&_mFileIO.isDownloading()){_mFileIO.registerNotifier("yahoo-feed-bookmarks-updated");}};this.bumpUpBM2Usage=function(bid){if(!bid){return;}
var cnt=1;if(_self.bm2Usage[bid]){cnt=parseInt(_self.bm2Usage[bid],10);cnt=(cnt<1?0:cnt)+1;}
_self.bm2Usage[bid]=""+cnt;};this.getBM2UsageString=function(){var str="";for(key in _self.bm2Usage){if(key){str+=(str.length<1?"":",")+key+"|"
+_self.bm2Usage[key];}}
return str;};this.clearBM2Usage=function(){for(key in _self.bm2Usage){_self.bm2Usage[key]=null;}
_self.bm2Usage=[];};this.QueryInterface=function(iid){if(!iid.equals(CI.nsIYahooDomBuilder)&&!iid.equals(CI.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}
try{var _mConfigManager=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);_self.iconsOnly=_mConfigManager.getBoolValue("options.iconsonly");}catch(e){yahooError(e);}
_self.clear();}
function NSGetModule(compMgr,fileSpec){return{myCID:Components.ID("{15e84d13-9bda-4810-ad02-437d2580c87d}"),myProgID:"@yahoo.com/dombuilder;1",firstTime:true,registerSelf:function(compMgr,fileSpec,location,type){if(this.firstTime){this.firstTime=false;throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;}
compMgr=compMgr.QueryInterface(CI.nsIComponentRegistrar);compMgr.registerFactoryLocation(this.myCID,"Yahoo! Dom Builder",this.myProgID,fileSpec,location,type);},getClassObject:function(compMgr,cid,iid){if(!cid.equals(this.myCID)){throw Components.results.NS_ERROR_NO_INTERFACE;}
if(!iid.equals(CI.nsIFactory)){throw Components.results.NS_ERROR_NOT_IMPLEMENTED;}
return this.myFactory;},myFactory:{createInstance:function(outer,iid){if(outer!==null){throw Components.results.NS_ERROR_NO_AGGREGATION;}
return new YahooDomBuilder().QueryInterface(iid);}},canUnload:function(compMgr){return true;}};}