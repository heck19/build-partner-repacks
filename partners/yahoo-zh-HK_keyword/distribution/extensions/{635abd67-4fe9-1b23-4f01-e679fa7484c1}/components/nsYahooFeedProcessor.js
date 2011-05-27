
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var CI=Components.interfaces;var CC=Components.classes;var loader=CC["@mozilla.org/moz/jssubscript-loader;1"].getService(CI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/utils.js");loader.loadSubScript("chrome://ytoolbar/content/logger.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(Components.interfaces.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function yFeedProcessor(){var _self=this;var layout="";var toolbarmanager=null;var localstorage=CC["@yahoo.com/localstorage;1"].getService(CI.nsIYahooLocalStorage);var mFileIO=CC["@yahoo.com/fileio;1"].getService(CI.nsIYahooFileIO2);var mConfigMgr=CC["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);var notifier=CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService);var feedFetcher=CC["@yahoo.com/feed/fetcher;1"].getService(CI.nsIYahooFeedFetcher);var feedNodeCollection=CC["@mozilla.org/array;1"].createInstance(CI.nsIMutableArray);var userSecFeedNodeCollection=CC["@mozilla.org/array;1"].createInstance(CI.nsIMutableArray);var mPluginManager=CC["@yahoo.com/ypluginmanager;1"].getService(CI.nsIYahooPluginManager);var fpInit=false;var processedCache=false;var charsets=[];charsets[1]='iso-8859-1';charsets[128]='shift_jis';charsets[129]='euc-kr';charsets[130]='johab';charsets[134]='gb2312';charsets[136]='Big5';charsets[161]='windows-1253';charsets[162]='windows-1254';charsets[163]='windows-1258';charsets[177]='windows-1255';charsets[178]='windows-1256';charsets[186]='windows-1257';charsets[204]='windows-1251';charsets[222]='windows-874';charsets[238]='windows-1250';var uniconvert=CC["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(CI.nsIScriptableUnicodeConverter);uniconvert.charset='utf-8';var stylesMapping={"std":{1:"OUTLINE",2:"ROUNDEDGE",4:"HIGHLIGHT",8:"RAISED",16:"STATIC",32:"TOGGLE",64:"MODIFIABLE",128:"LOCAL",256:"NOMENUHIDE",512:"NOTEXT",1024:"NOMORE",2048:"REMOVEONCLICK",4096:"TOGGLEOFF",8192:"MINIMIZABLE",16384:"REDIRECT",32768:"MENUITEM",65536:"NOUSECACHE",131072:"NOTOOLTIP",262144:"ALWAYSPRESSED",524288:"ANIMATED",1048576:"ALWAYSHIDE",2097152:"BROWSERIMAGE",1073741824:"HIGHLIGHTICON",33554432:"HIDEARROW"},"ext":{1:"EX_ALIGNCENTER",2:"EX_ALIGNRIGHT",4:"EX_MODUSERES",8:"EX_MODUSERPAR",16:"EX_TBLINEFEED",32:"EX_TBNOCLOSE",64:"EX_TBNOGETMOD",128:"EX_TBPASSEDIT",256:"EX_TBFORCEGETMOD",4096:"HASSTATE",8192:"EX_ENABLEDBY",65536:"EX_ENABLEDBY",131072:"EX_NEWWINDOWTAB",1048576:"EX_RIGHTJUSTIFYBAND"}};this.raw="";this.loaded=false;this.domBuilder=null;this.localButtonProcessor=null;this.bookmarkManager=null;this.ybButtons=null;this.rssButtons="";var skinNode=null;var obsServ=null;this.init=function(tbManager){if(!fpInit){toolbarmanager=tbManager;_self.domBuilder=CC["@yahoo.com/dombuilder;1"].getService(CI.nsIYahooDomBuilder);_self.domBuilder.init();_self.localButtonProcessor=CC["@yahoo.com/feed/localbutton;1"].getService(CI.nsIYahooLocalButtonProcessor);_self.localButtonProcessor.init(toolbarmanager);_self.bookmarkManager=CC["@yahoo.com/bookmarkmanager;1"].getService(CI.nsIYahooBookmarkManager);_self.bookmarkManager.init(_self.domBuilder);_self.obsServ=CC['@mozilla.org/observer-service;1'].getService(CI.nsIObserverService);_self.obsServ.addObserver(this,"yahoo-need-pcache",false);fpInit=true;}};this.clear=function(){toolbarmanager.EventTipManager.clear();_self.domBuilder.bm2Feed=null;_self.bookmarkManager.clear();_self.domBuilder.clear();_self.loaded=false;processedCache=false;layout="";feedNodeCollection.clear();userSecFeedNodeCollection.clear();skinNode=null;};clearPartial=function(){_self.domBuilder.bm2Feed=null;_self.bookmarkManager.clear();_self.domBuilder.clear();_self.loaded=false;}
this.observe=function(aSubject,aTopic,aData){try{if(aTopic=="yahoo-need-pcache"){yahooUtils.setTimeout(function(){_self.pcache_feedUpdated(aData);},10);}}
catch(e){yahooError(e);}};this.pcache_feedUpdated=function(aData){try{if(aData==1){var mConfigMger=Components.classes["@yahoo.com/configmanager;1"].getService(CI.nsIYahooConfigManager);var cc=mConfigMger.getCharValue("installer.country")||"us";var pc=mConfigMger.getCharValue("toolbar.pc")||"";var time=new Date().getTime();var tid=mConfigMger.getCharValue("installer.toolbarID")||"";var cid=mConfigMgr.getCharValue("installer.corpID")||"";var lang=mConfigMgr.getCharValue("installer.language")||cc.substr(0,2);var cver=mConfigMgr.getCharValue("installer.version")||"2.3.4";if(cver!==""){cver=cver.split(".");if(cver.length>3){cver.length=3;}
cver=cver.join("_");}
var sc=mConfigMger.getCharValue("toolbar.sc")||"";var protocol="https:\/\/";var d_url="";if(mConfigMger.isKeyPresent("dataserver.url")){d_url=mConfigMger.getCharValue("dataserver.url");d_url=d_url.replace("$CONFIG_INTL$",cc);}else{d_url=cc+".data.toolbar.yahoo.com";}
if(mConfigMger.isKeyPresent("disablehttps")&&mConfigMger.getBoolValue("disablehttps")){protocol="http:\/\/";}
if(tid===""){tid="none";}
var url_pCache=protocol+d_url+"/pcache/v1/"+"?&.pc="+pc+"&.ta=cg"+tid+",cc"+cid+",ci"+lang+",cv"+cver+",cp"+pc+",cbm,cjs"+"&t="+time+"&.sc="+sc;var request=CC["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(CI.nsIXMLHttpRequest);request.open("GET",url_pCache,false);request.send(null);if(request.status!==200){throw"Error in Fetching pCache from server";}
var serverRaw=request.responseText;if(serverRaw.indexOf('{"e":[".CD"')==0){serverRaw=serverRaw.substr(17);var len=serverRaw.indexOf('"');serverRaw=serverRaw.substr(0,len);}
processCache(serverRaw,true);}else{retrieveLocalCache();}}catch(e){yahooError("Error in getting pCache: "+e);}};this.saveToUDB=function(){yahooUtils.setTimeout(function(){feedFetcher.pushLayoutToServer(1,layout,toolbarmanager.isGuestMode());},5);};this.saveAndReload=function(){yahooUtils.setTimeout(function(){if(toolbarmanager.isGuestMode()||_self.localButtonProcessor.getUserOpt_SaveLocal()){saveLayoutToPref(layout);}
feedFetcher.pushLayoutToServer(1,layout,toolbarmanager.isGuestMode());_self.processServerFeed();},5);};procResponse=function(raw){_self.raw=raw;yahooDebug("DINGO DINGO "+_self.raw);if(_self.raw!==""){_self.clear();processJSONBHFeed();if(!toolbarmanager.isGuestMode()){_self.domBuilder.bm2Feed="http://us.bookmarks.yahoo.com/bm2_toolbar.php?appid=toolbar&needpref=1&v=1&cmd=retrieval&size=300000&gfu=1&lang=US";_self.bookmarkManager.processBookmarks(false);}}else{throw"Error processing server feed";}};this.processServerFeed=function(){yahooUtils.setTimeout(function(){try{_self.loaded=false;if(yahooUtils.mFFVersion<=2)
feedFetcher.asyncLoadServerFeed(toolbarmanager.isGuestMode(),new WrapperClass(procResponse));else
procResponse(feedFetcher.loadServerFeed(toolbarmanager.isGuestMode()));}
catch(e){yahooError(e);}},5);};this.processCachedFeed=function(localCacheFile){yahooUtils.setTimeout(function(){try{_self.raw=feedFetcher.loadCachedFeed(localCacheFile);if(_self.raw!==""){_self.clear();processJSONBHFeed();if(!toolbarmanager.isGuestMode()){_self.domBuilder.bm2Feed="http://us.bookmarks.yahoo.com/bm2_toolbar.php?appid=toolbar&needpref=1&v=1&cmd=retrieval&size=300000&gfu=1&lang=US";_self.bookmarkManager.processBookmarks(false);}}else{throw"Error processing cached feed";}}catch(e){yahooError(e);}},5);};this.setLayout=function(newLayout,groupID){if(_self.loaded){yahooUtils.setTimeout(function(){clearPartial();var addToMyNode=null;var oldLayout=layout.split(",");layout=newLayout;newLayout=newLayout.split(",");feedFetcher.pushLayoutToServer(1,layout,toolbarmanager.isGuestMode());if(toolbarmanager.isGuestMode()||_self.localButtonProcessor.getUserOpt_SaveLocal()){saveLayoutToPref(layout);}
mConfigMgr.setBoolValue('buttons.close-yahoo-toolbar-grp_fav',false,true);mConfigMgr.setBoolValue('buttons.close-yahoo-toolbar-grp_cna',false,true);if((newLayout.length>oldLayout.length)||(newLayout[0]==="")){_self.processServerFeed();return;}
for(var i=0;i<userSecFeedNodeCollection.length;i++){var node=userSecFeedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode);if(node.id&&node.id.substr(14).length===3&&node.id.indexOf("rss")===14){addToMyNode=node;userSecFeedNodeCollection.removeElementAt(i);}}
var len=userSecFeedNodeCollection.length;if(newLayout.length===oldLayout.length){for(var i=0;i<len;i++){var cur_node=userSecFeedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode);if(cur_node.id&&cur_node.id.substr(14)!=newLayout[i]){for(var j=i;j<len;j++){var node=userSecFeedNodeCollection.queryElementAt(j,CI.nsIYahooFeedNode);if(node.id&&node.id.substr(14)==newLayout[i]){userSecFeedNodeCollection.removeElementAt(j);userSecFeedNodeCollection.insertElementAt(node,i,false);break;}}}}
var file=mFileIO.getUserCacheDir();file.appendRelativePath("feed");if(file.exists()){file.remove(true);}}
if(newLayout.length<oldLayout.length){newLayout.push(" ");for(var i=0;i<len;i++){var cur_node=userSecFeedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode);if(cur_node.id&&newLayout[i]!==cur_node.id.substr(14)){userSecFeedNodeCollection.removeElementAt(i);break;}}
newLayout.pop();var file=mFileIO.getUserCacheDir();file.appendRelativePath("feed");if(file.exists()){file.remove(true);}}
if(addToMyNode){len=userSecFeedNodeCollection.length;for(var i=0;i<len;i++){var cur_node=userSecFeedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode);if(cur_node.id&&cur_node.id.substr(14)=="my"){userSecFeedNodeCollection.insertElementAt(addToMyNode,i,false);break;}}}
_self.domBuilder.clear();_self.domBuilder.setSkinParams(skinNode);for(var i=0;i<feedNodeCollection.length;i++){buildDOM(feedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode),null);}
for(var i=0;i<userSecFeedNodeCollection.length;i++){buildDOM(userSecFeedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode),null);}
if(!_self.loaded){_self.loaded=true;notifier.notifyObservers(_self,"yahoo-feed-updated",null);notifier.notifyObservers(_self,"yahoo-feed-alerts-updated",null);if(!toolbarmanager.isGuestMode()){_self.domBuilder.bm2Feed="http://us.bookmarks.yahoo.com/bm2_toolbar.php?appid=toolbar&needpref=1&v=1&cmd=retrieval&size=300000&gfu=1&lang=US";_self.bookmarkManager.processBookmarks(false);}}},1);}};this.getLayout=function(groupID){var retLayout=layout;if(groupID!=""&&_self.domBuilder.groupId!=""&&groupID==_self.domBuilder.groupId){retLayout=_self.domBuilder.groupLayout;}
if(retLayout[retLayout.length-1]==','){retLayout=retLayout.substr(0,retLayout.length-1);}
yahooDebug("getLayout -> "+retLayout);return retLayout;};saveLayoutToPref=function(layout){layout=yahooUtils.stripTrailingComma(layout);if(mConfigMgr.getCharValue('toolbar.layout'))
{mConfigMgr.setCharValue('previous.layout',mConfigMgr.getCharValue('toolbar.layout'),true);}
mConfigMgr.setCharValue('toolbar.layout',layout,true);};preserveCache=function(cacheblob){try{var file=mFileIO.getUserCacheDir();file.appendRelativePath("cachesection");mFileIO.writeFile(file,cacheblob);}catch(e){yahooError("Error in preserveCache"+e);}};processLocalYBCache=function(){try{var cacheblobfile=mFileIO.getUserCacheDir();cacheblobfile.appendRelativePath("ybcache");if(cacheblobfile.exists()){var fileContent=mFileIO.readFile(cacheblobfile);fileContent=fileContent.replace(/\\\"/g,"\"");this.ybButtons=yahooUtils.JSON.parse("{\"yb\":{"+fileContent+"}}");}}catch(e){yahooError("Error in processLocalYBCache"+e);}};retrieveLocalCache=function(){try{yahooDebug("Retrieving Local cache feed component");var cacheblobfile=mFileIO.getUserCacheDir();cacheblobfile.appendRelativePath("cachesection");if(cacheblobfile.exists()){var fileContent=mFileIO.readFile(cacheblobfile);processCache(fileContent,false);}else{yahooDebug("Cache file does not exist");}}catch(e){yahooError("Error in retrieveLocalCache"+e);}};processCaches=function(cacheblob){try{cacheblob=yahooUtils.prepareJsonForEval(cacheblob);var len=cacheblob.indexOf('{p:');if(len==-1){len=cacheblob.length;}
if(len!=0){var ybCache=cacheblob.substr(0,len);ybCache=ybCache.substr(5,ybCache.length-8);yahooDebug(ybCache);var ybCache1=ybCache;var spt=ybCache1.split(':{"e":');var key,t1,val,value;for(var idx=1;idx<spt.length;idx++){if(idx==1){key=spt[0].split("\"")[1];t1=spt[idx].split(",");val=t1[t1.length-1];value='{"e":'+spt[idx].split(val)[0];}
else if(idx==(spt.length-1))
{key=val.split("\"")[1];value='{"e":'+spt[spt.length-1];}
else
{key=val.split("\"")[1];t1=spt[idx].split(",");val=t1[t1.length-1];value='{"e":'+spt[idx].split(val)[0];}
yahooDebug("key  "+key+"value  "+value);value=value.replace(/\"/g,"\\\"");var file=mFileIO.getUserCacheDir();file.appendRelativePath(key);mFileIO.writeUnicodeFile(file,value);}
ybCache=ybCache.replace(/\"/g,"\\\"");var file=mFileIO.getUserCacheDir();file.appendRelativePath("ybcache");mFileIO.writeFile(file,ybCache);}
len=cacheblob.indexOf('{p:');if(len!=-1){cacheblob=cacheblob.substr(len);cacheblob=cacheblob.replace(/{p:/g,"{\"p\":");var caches=yahooUtils.JSON.parse(cacheblob);if(caches.p)processCache(caches.p,true);}}catch(e){yahooError("Error in processCaches"+e);}};processYBcache=function(cacheblob){try{this.ybButtons=cacheblob;}catch(e){yahooError("Error in processYBcache"+e);}};processCache=function(cacheblob,preserve){try{if(preserve){preserveCache(cacheblob);}
processedCache=true;var ucb=unescape(cacheblob);var pos=0;while(pos<ucb.length){var ch;var param="";var params=[];var first=_self.raw.charAt(pos++);while(pos<ucb.length){ch=ucb[pos++];if(first=='\x16'){if(params.length===0){params[0]="";}else if(params.length==2){params[2]='\x16';params[3]="";}else if(params.length==10){params[10]="";}}
if(ch=='\x19'||ch=='\x15'){params[params.length]=param;param="";break;}
else if(ch=='\x18'){params[params.length]=param;param="";}
else{param+=ch;}}
if(params.length>=1){if(params[0]=="yso_grp_fav"){var file=mFileIO.getUserCacheDir();file.appendRelativePath("app.html");mFileIO.writeFile(file,params[1]);}}}}catch(e){yahooError("Error in ProcessCache"+e);}};processJSONBHFeed=function(){_self.raw=_self.raw.replace(/\\t/g,"\\\\t");if(CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo).platformVersion.indexOf("2")==0){_self.raw=_self.raw.replace(/\ca/g,"\\u0001");_self.raw=_self.raw.replace(/\cb/g,"\\u0002");_self.raw=_self.raw.replace(/\cc/g,"\\u0003");_self.raw=_self.raw.replace(/\cd/g,"\\u0004");_self.raw=_self.raw.replace(/\ce/g,"\\u0005");_self.raw=_self.raw.replace(/\cf/g,"\\u0006");_self.raw=_self.raw.replace(/\cg/g,"\\u0007");_self.raw=_self.raw.replace(/\ch/g,"\\u0008");_self.raw=_self.raw.replace(/\ci/g,"\\u0009");_self.raw=_self.raw.replace(/\cn/g,"\\u000E");_self.raw=_self.raw.replace(/\co/g,"\\u000F");_self.raw=_self.raw.replace(/\cx/g,"\\u0018");_self.raw=_self.raw.replace(/\cy/g,"\\u0019");_self.raw=_self.raw.replace(/\x82/g,"\\u0082");}
try{var ding=yahooUtils.JSON.parse(_self.raw);yahooDebug("Eval Success - Correct JSON Feed");if(ding.v!==undefined){processValuesSection(ding.v);}
if(ding.s!==undefined){processSensitiveSection(ding.s);}
if(ding.p!==undefined){processParamsSection(ding.p);}
if(ding.y!==undefined){processYahooSection(ding.y);}
if(ding.u!==undefined){processUserSection(ding.u);}
if(processedCache===false){retrieveLocalCache();}
for(var i=0;i<feedNodeCollection.length;i++){buildDOM(feedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode),null);}
for(var i=0;i<userSecFeedNodeCollection.length;i++){buildDOM(userSecFeedNodeCollection.queryElementAt(i,CI.nsIYahooFeedNode),null);}
var prefSrvc=CC["@mozilla.org/preferences-service;1"].getService(CI.nsIPrefBranch);if(toolbarmanager.isGuestMode()&&!prefSrvc.prefHasUserValue('yahoo.ytff.toolbar.layout')){saveLayoutToPref(layout);}
if(localstorage.getString("lay")&&_self.localButtonProcessor.getUserOpt_SaveLocal()){saveLayoutToPref(unescape(localstorage.getString("lay")));}
if(localstorage.getString("port")!=null)
{mConfigMgr.setCharValue('layout.portable',localstorage.getString("port"),true);}
toolbarmanager.AlertManager.initAlertPolltime();if(!_self.loaded){_self.loaded=true;notifier.notifyObservers(_self,"yahoo-feed-updated",null);notifier.notifyObservers(_self,"yahoo-feed-alerts-updated",null);}}catch(e){yahooError("Error in ProcessJSONBHFeed"+e);}};buildDOM=function(feedNode,parentDOMNode){if(feedNode.hash&&feedNode.hash!=""){var hash=yahooUtils.JSON.parse(feedNode.hash);if(hash.sign&&((hash.sign=="1"&&toolbarmanager.isGuestMode())||(hash.sign=="0"&&!toolbarmanager.isGuestMode())))return;}
feedNode.domToolbar=_self.domBuilder.addNode(feedNode,parentDOMNode?parentDOMNode:null);for(var j=0;j<feedNode.childSize;j++){var childNode=feedNode.getChild(j);buildDOM(childNode,feedNode.domToolbar);}};processValuesSection=function(section){try{for(var i=0;i<section.length;i++){var processedNode=processToolbarElement(null,section[i]);if(processedNode)feedNodeCollection.appendElement(processedNode,false);}}catch(e){yahooError("Error processing VSec - \n"+e);}};processSensitiveSection=function(section){try{for(var i=0;i<section.length;i++){var processedNode=processToolbarElement(null,section[i]);if(processedNode)feedNodeCollection.appendElement(processedNode,false);}}catch(e){yahooError("Error processing SSec - \n"+e);}};processParamsSection=function(section){try{for(var i=0;i<section.length;i++){var processedNode=processToolbarElement(null,section[i]);if(processedNode)feedNodeCollection.appendElement(processedNode,false);}}catch(e){yahooError("Error processing PSec - \n"+e);}};processYahooSection=function(section){try{for(var i=0;i<section.length;i++){var processedNode=processToolbarElement(null,section[i]);if(processedNode)feedNodeCollection.appendElement(processedNode,false);}}catch(e){yahooError("Error processing YSec - \n"+e);}};processUserSection=function(section){try{var processYOB=true;var actualLayout=[];for(var i=0;i<section.length;i++){var processedNode=processToolbarElement(null,section[i]);if(processedNode){if(_self.localButtonProcessor.isLocal(processedNode.id)){if(localstorage.getString("yapkill")=="1"){processedNode.type=processedNode.BUTTON_TYPE;}
processYOB=false;}
if(processedNode.id){var id=processedNode.id.substr(14);if(!(id.length===3&&id.indexOf("rss")===0))
actualLayout.push(id);}
userSecFeedNodeCollection.appendElement(processedNode,false);}}
if(localstorage.getString("lay")&&_self.localButtonProcessor.getUserOpt_SaveLocal()){layout=unescape(localstorage.getString("lay"));}
layout=yahooUtils.stripTrailingComma(layout);if(processYOB&&(toolbarmanager.isGuestMode()||_self.localButtonProcessor.getUserOpt_SaveLocal())){var currentLayout=layout.split(',');for(var j=0;j<currentLayout.length;j++){if(_self.localButtonProcessor.isLocal(currentLayout[j])){var pos=j;var insertPos=j;if(pos>=actualLayout.length){pos=actualLayout.length;insertPos=userSecFeedNodeCollection.length;}
var localBtnNode=createNodeForLocalButton(currentLayout[j]);userSecFeedNodeCollection.insertElementAt(localBtnNode,insertPos,false);actualLayout.splice(pos,0,localBtnNode.id.substr(14));}}}
if(localstorage.getString("port")!="-1"){layout=actualLayout.join(",");}}catch(e){yahooError("Error processing USec - \n"+e);}};createNodeForLocalButton=function(buttonID){var buttonJSON=yahooUtils.JSON.parse(_self.localButtonProcessor.getLocalButtonJSON(buttonID));var node=CC["@yahoo.com/feed/node;1"].createInstance(CI.nsIYahooFeedNode);if(buttonJSON.ysoid&&localstorage.getString("yapkill")!="1"){node.type=node.BUTTONSLIDEOUT_TYPE;node.hash='{"id":"'+buttonID+'", "grp":"grp_fav", "ysoid":"'+buttonJSON.ysoid+'"}';}else{node.type=node.BUTTON_TYPE;node.hash='{"id":"'+buttonID+'", "grp":"grp_fav"}';}
node.childSize=0;node.icon=buttonJSON.icon;node.name=buttonJSON.title;node.id="yahoo-toolbar-"+buttonID;node.value="";node.func="";node.funcNum=4;node.funcTracking="";node.funcUrl=buttonJSON.url;node.styles="";node.parentNode=null;return node;};preProcessElement=function(pos){var elem=[];if(pos.e){elem=pos.e;}
if(pos.i){if(layout!==''){layout+=',';}
layout+=pos.i;}
if(pos.m){elem[0]="";for(var i=0;i<pos.m.length;i++){elem[elem.length]=pos.m[i];if(elem.length==2){elem[elem.length]='\x16';elem[elem.length]="";}
if(elem.length==10){elem[elem.length]="";}}}
return elem;};preProcessName=function(name){var retVal=name;if(retVal.indexOf("AE_")>=0)retVal="AE_";if(retVal.indexOf("ep[")>=0)retVal="ep[";return retVal;};processHash=function(node,raw_hash,pos){var isSlideout=false;try{if(raw_hash){var hash=raw_hash;if(hash.icov||hash.iconemp||hash.iconbh){var temp_icon=hash.iconemp?hash.iconemp:(hash.iconbh?hash.iconbh:hash.icov);node.icon=temp_icon;setIconUrl(node,hash);}
if(hash.is){node.icon=hash.is+"/"+node.icon;setIconUrl(node,hash);}
if(hash.id){if(hash.id.length>5&&(hash.id).substr(0,5)=="%40lb")
hash.id=unescape(hash.id);hash.id=hash.id.replace(/%40lb/g,"@lb");node.id=hash.id.replace(/g_/g,"_");}
if(hash.ysoid){hash.ysoid=hash.ysoid.replace(/%40ya/g,"@ya");}
node.hash=yahooUtils.JSON.stringify(hash);localstorage.putObject(node.id,new WrapperClass(pos));var eval_hash=yahooUtils.JSON.parse(node.hash);if(eval_hash.ysoid){node.type=node.BUTTONSLIDEOUT_TYPE;isSlideout=true;}}}catch(e){yahooError(e);}finally{return isSlideout;}};processFunctionDefition=function(node){if(node.func){node.func=node.func.replace(/,/g,"%2C");node.func=node.func.replace(/%25/g,"");node.func=node.func.replace(/\\u0001/g,"\x01");var func=node.func.split('\x01');node.func=func.join(",");if(func.length>1){node.funcNum=parseInt(func[1],10);if(func.length>2){node.funcTracking=func[2];}
if(func.length>3){func.splice(0,3);node.funcUrl=func.join(",");}}
else if(func.length==1){node.funcNum=-1;node.funcUrl=func[0];}
func=null;}};processChildElements=function(node,pos,isSlideout){if(pos.c&&pos.c.length>0){switch(node.type){case node.BUTTON_TYPE:node.type=node.BUTTONMENU_TYPE;break;case node.MENUITEM_TYPE:node.type=node.MENU_TYPE;break;}
if(!isSlideout){for(var k=0;k<pos.c.length;k++){processToolbarElement(node,pos.c[k]);}}}
else{if(node.type===node.BUTTONMENU_TYPE){node.type=node.BUTTON_TYPE;}
if(node.type===node.MENU_TYPE){node.type=node.MENUITEM_TYPE;}}};populateLocalStorage=function(parent,node,pos){if(parent===null&&node.type==node.PARAM_TYPE)
localstorage.putString(node.name,node.func);if(parent&&parent.type==parent.PARAM_TYPE){localstorage.putString(parent.name+'-'+node.name,node.func);}
if(parent===null&&node.id!="yahoo-toolbar-acs"){localstorage.putObject(node.id,new WrapperClass(pos));}};processToolbarElement=function(parent,pos){try{var elem=preProcessElement(pos);if(elem[0]==".I"){var ybId=elem[1].substr(3);yahooDebug("ybidddddddddddddd"+ybId);var bfile=mFileIO.getUserCacheDir();bfile.appendRelativePath(ybId);if(bfile.exists()){var usedlist="";if(mConfigMgr.getCharValue('ybButtons.used'))
{usedlist=mConfigMgr.getCharValue('ybButtons.used');usedlist=usedlist+","+ybId;mConfigMgr.setCharValue('ybButtons.used',usedlist,true);}
else
{mConfigMgr.setCharValue('ybButtons.used',ybId,true);}
var fileContent=mFileIO.readUnicodeFile(bfile);fileContent=fileContent.replace(/\\\"/g,"\"");yahooDebug("file exists"+fileContent);if(fileContent.substr(fileContent.length-1)==","){fileContent=fileContent.substr(0,fileContent.length-1);}
if(CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo).platformVersion.indexOf("2")==0){fileContent=fileContent.replace(/\ca/g,"\\u0001");fileContent=fileContent.replace(/\cb/g,"\\u0002");fileContent=fileContent.replace(/\cc/g,"\\u0003");fileContent=fileContent.replace(/\cd/g,"\\u0004");fileContent=fileContent.replace(/\ce/g,"\\u0005");fileContent=fileContent.replace(/\cf/g,"\\u0006");fileContent=fileContent.replace(/\cg/g,"\\u0007");fileContent=fileContent.replace(/\ch/g,"\\u0008");fileContent=fileContent.replace(/\ci/g,"\\u0009");fileContent=fileContent.replace(/\cn/g,"\\u000E");fileContent=fileContent.replace(/\co/g,"\\u000F");fileContent=fileContent.replace(/\cx/g,"\\u0018");fileContent=fileContent.replace(/\cy/g,"\\u0019");fileContent=fileContent.replace(/\x82/g,"\\u0082");}
pos=yahooUtils.JSON.parse(fileContent);}
if(pos){elem=preProcessElement(pos);}else{return null;}}
if(elem.length>1){var node=CC["@yahoo.com/feed/node;1"].createInstance(CI.nsIYahooFeedNode);var hash=elem[12];node.name=elem[1];node.name=node.name.replace(/\^T/g," ");var nodeType=elem[2];nodeType=nodeType.replace(/\\u0002/g,"\u0002");nodeType=nodeType.replace(/\\u0003/g,"\u0003");nodeType=nodeType.replace(/\\u0004/g,"\u0004");nodeType=nodeType.replace(/\\u0005/g,"\u0005");nodeType=nodeType.replace(/\\u0006/g,"\u0006");nodeType=nodeType.replace(/\\u0007/g,"\u0007");nodeType=nodeType.replace(/\\u0008/g,"\u0008");nodeType=nodeType.replace(/\\u0009/g,"\u0009");nodeType=nodeType.replace(/\\u0023/g,"\u0023");nodeType=nodeType.replace(/\\u000E/g,"\u000E");nodeType=nodeType.replace(/\\u000F/g,"\u000F");nodeType=nodeType.replace(/\\u000e/g,"\u000e");nodeType=nodeType.replace(/\\u000f/g,"\u000f");nodeType=nodeType.replace(/\\u0016/g,"\u0016");nodeType=nodeType.replace(/\\u0017/g,"\u0017");nodeType=nodeType.replace(/\\u0082/g,"\u0082");nodeType=nodeType.replace(/\\u0083/g,"\u0083");node.type=nodeType.charCodeAt(0);node.icon=elem[3];node.func=elem[4];switch(node.type){case node.VALUE_TYPE:localstorage.putString(node.name,elem[3]);node=null;return null;case 0x05:node.type=node.BUTTONMENU_TYPE;break;case 0x00:node.type=node.BUTTONMENU_TYPE;break;}
switch(preProcessName(node.name)){case"Ticker":node.type=node.BUTTON_TYPE;break;case"1":{processCaches(elem[2]);if(elem[3]){var pCache=elem[3];pCache=pCache.replace(/{p:/g,"{\"p\":");var pCacheObj=yahooUtils.JSON.parse(pCache);if(pCacheObj.p)processCache(pCacheObj.p,true);}}
break;case"sck":feedFetcher.setSecureKey(elem[4]);_self.bookmarkManager.setSecureKey(elem[4]);break;case"lang":if(node.type==node.PARAM_TYPE&&isFinite(node.icon)){uniconvert.charset=charsets[node.icon];_self.raw=uniconvert.ConvertToUnicode(_self.raw);}
break;case"needpcache":if(node.type==node.PARAM_TYPE){notifier.notifyObservers(_self,"yahoo-need-pcache",elem[4]);}
break;case"yob":var jsonDef=elem[4];for(var idx=0;idx<jsonDef.length;idx++){jsonDef[idx].icon=jsonDef[idx].icon.replace(/\\/g,"");jsonDef[idx].url=jsonDef[idx].url.replace(/\\/g,"");_self.localButtonProcessor.saveLocalButton(yahooUtils.JSON.stringify(jsonDef[idx]),jsonDef[idx].id);}
break;case"port":_self.localButtonProcessor.setUserOpt_SaveLocal((node.func==0?true:false));break;case"-":case"vsep":case"spr":case"spr_div":case"sep":node.type=node.SEPARATOR_TYPE;break;case"AE_":var keysplit=node.name.split('_');var alertid=parseInt(keysplit[1],10);var index=parseInt(keysplit[2],10);if(node.name=="AE_206_1"){vJSONObj=yahooUtils.JSON.parse(unescape(elem[4]));toolbarmanager.AlertManager.addAlertObject(alertid,index,new WrapperClass(vJSONObj));}else if(node.name=="AE_210"){var str1='{"AE_210_1" :'+yahooUtils.JSON.stringify(elem[4])+"}";toolbarmanager.AlertManager.processJSONAlerts(str1);}else if(node.name=="AE_205_1"){var str1='{"AE_205_1" :'+yahooUtils.JSON.stringify(elem[4])+"}";toolbarmanager.AlertManager.processJSONAlerts(str1);}else if(node.name=="AE_TTL_OVERRIDE"){var str1='{"AE_TTL_OVERRIDE" :'+yahooUtils.JSON.stringify(elem[4])+"}";toolbarmanager.AlertManager.processJSONAlerts(str1);}else if(node.name=="AE_211"){var str1='{"AE_211_1" :'+yahooUtils.JSON.stringify(elem[4])+"}";toolbarmanager.AlertManager.processJSONAlerts(str1);}else{toolbarmanager.AlertManager.addAlertData(alertid,index,elem[4]);}
break;case"ep[":var length=node.name.length-4;var key=node.name.substr(3,length);toolbarmanager.AlertManager.setExtraParam(key,elem[4],true);break;}
processStyles(node,elem[5],elem[7]);var isSlideout=processHash(node,hash,pos);setIconUrl(node,hash);processFunctionDefition(node);if(node.id){if(node.id.indexOf("rss_")>-1&&node.type==node.BUTTONMENU_TYPE){_self.rssButtons+=node.id+",";yahooDebug("rss added"+_self.rssButtons);}
node.id=((parent&&parent.id)?parent.id:"yahoo-toolbar")+"-"+node.id;}
populateLocalStorage(parent,node,pos);processChildElements(node,pos,isSlideout);if(parent!==null&&parent instanceof CI.nsIYahooFeedNode){parent.addChild(node);}
if(node.type==node.SKIN_TYPE){skinNode=node;_self.domBuilder.setSkinParams(node);}
if(parent===null&&node.id=="yahoo-toolbar-etp"){toolbarmanager.EventTipManager.addEventTip(node);}
if(parent===null&&(node.hash.indexOf("partner_clsid")>-1)){yahooDebug("Adding PlugIn CLSID to PlugIn Map");mPluginManager.addToPlugInMap(node.id,node.hash);}
return((parent===null&&node.id!="yahoo-toolbar-acs"&&node.id!="yahoo-toolbar-etp")?node:null);}}catch(e){yahooError(e);}};processStyles=function(node,styles,extStyles){var bit=0;var nodeStyles=",";var stdBits=stylesMapping.std;var extBits=stylesMapping.ext;try{if(!styles&&!extStyles){return;}
var key;if(styles>0){for(key in stylesMapping.std){if(styles&key){nodeStyles+=stdBits[key]+",";}}}
if(extStyles>0){for(key in extBits){if(extStyles&key){nodeStyles+=extBits[key]+",";}}}
node.styles=nodeStyles;}catch(e){yahooError(e);}};setIconUrl=function(node,hash){if(!node.icon)return;if(node.icon.indexOf(/yob/)!==-1||node.icon.indexOf("http")!==-1||node.icon.indexOf("us.i1.yimg.com")!=-1){return;}
var icon=node.icon;var iconHost="l.yimg.com",iconDir="\/a\/i\/tb\/icons",icongifDir="l.yimg.com\/a\/i\/tb\/iconsgif";if(localstorage.getString("i")!=null)
iconHost=localstorage.getString("i");if(localstorage.getString("iu")!=null)
iconDir=localstorage.getString("iu");if(localstorage.getString("ig")!=null)
icongifDir=localstorage.getString("ig");var path="http:\/\/"+iconHost+iconDir+"\/";icon=icon.replace(/\\\\/i,"/");icon=icon.replace(/\\/i,"/");if(icon.indexOf("/")==-1&&hash&&!(hash.iconbh||hash.iconemp)){path="http:\/\/"+icongifDir+"\/";}
if(icon.indexOf(".")<0){node.icon="chrome:\/\/ytoolbar/skin/"+icon+".gif";}
else{if(hash&&!(hash.iconbh||hash.iconemp)){icon=icon.replace(/\.bmp$/i,".gif");}
if(node.styles.indexOf('HASSTATE')!=-1&&node.type!=node.MENU_TYPE){icon=icon.replace(/\.png$/i,"_s0.png");}
path+=icon;node.icon=path;}};};yFeedProcessor.prototype={classID:Components.ID("{05F8BDE2-514C-40fe-847D-8D39F3C5E3B5}"),contractID:"@yahoo.com/feed/processor;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooFeedProcessor])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([yFeedProcessor]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([yFeedProcessor]);