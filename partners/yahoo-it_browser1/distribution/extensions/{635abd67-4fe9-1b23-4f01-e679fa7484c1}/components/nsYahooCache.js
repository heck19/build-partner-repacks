
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");var yahooCC=Components.classes;var yahooCI=Components.interfaces;var loader=yahooCC["@mozilla.org/moz/jssubscript-loader;1"].getService(yahooCI.mozIJSSubScriptLoader);loader.loadSubScript("chrome://ytoolbar/content/logger.js");function WrapperClass(object){this.wrappedJSObject=this;this.object=object;}
WrapperClass.prototype={QueryInterface:function(iid){if(!iid.equals(yahooCI.nsISupports)){throw Components.results.NS_ERROR_NO_INTERFACE;}
return this;}};function YahooCache(){this.localstorage=Components.classes["@yahoo.com/localstorage;1"].getService(Components.interfaces.nsIYahooLocalStorage);this.confMgr=Components.classes["@yahoo.com/configmanager;1"].getService(Components.interfaces.nsIYahooConfigManager);this.prefetchService=yahooCC["@mozilla.org/prefetch-service;1"].getService(yahooCI.nsIPrefetchService);this.mFileIO=yahooCC["@yahoo.com/fileio;1"].getService(yahooCI.nsIYahooFileIO2);this.mConfigMgr=yahooCC["@yahoo.com/configmanager;1"].getService(yahooCI.nsIYahooConfigManager);this.masterManifestURL="";this.fetchTimer=yahooCC["@mozilla.org/timer;1"].createInstance(yahooCI.nsITimer);this.first_time_delay=0;this.fetch_frequency=3600;this.timetolive=24*60;if(this.mConfigMgr.isKeyPresent("cacheloader.prefetcherAgent")){this.prefetcherAgent=this.mConfigMgr.getIntValue("cacheloader.prefetcherAgent");}else{this.prefetcherAgent=2;}};YahooCache.prototype={prefetchService:null,mFileIO:null,isDownloading:false,localstorage:null,confMgr:null,timer:null,pollinterval:-1,isPrefetchRunning:false,abortCacheloader:false,prefetchURI:function(url,bExplicit)
{try{if(this.prefetcherAgent==1){var hostname=this.getHostName(this.convertToURI(url));hostname+="http://"+hostname;this.prefetchService.prefetchURI(this.convertToURI(url),this.convertToURI(url),null,bExplicit);}else if(this.prefetcherAgent==2){var request=yahooCC["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(yahooCI.nsIXMLHttpRequest);request.open("GET",url,true);request.onreadystatechange=function(aEvt){};request.send(null);}}catch(e){yahooError(e.message);}},initCacheloaderPoll:function(interval){if(typeof interval==='undefined'){interval=30;}
if(this.timer!==null&&interval!=this.pollinterval){this.stopCacheloaderPoll();}
this.pollinterval=interval;var cacheloader=this;var callback={notify:function(timer){try{if(!cacheloader.isInBrowserCache(cacheloader.masterManifestURL)){cacheloader.mConfigMgr.setCharValue('cacheloader.ytff',"",true);cacheloader.getManifest();}}catch(e){yahooError(e.message);}}};if(this.timer==null){this.timer=yahooCC["@mozilla.org/timer;1"].createInstance(yahooCI.nsITimer);}
this.timer.initWithCallback(callback,this.pollinterval*1000,this.timer.TYPE_REPEATING_PRECISE);},isInBrowserCache:function(url){try{var wm=Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);navWin=wm.getMostRecentWindow("navigator:browser");if(!navWin.navigator.mozIsLocallyAvailable(url,false))
{return false;}}
catch(e){yahooError(e.message);}
return true;},stopCacheloaderPoll:function(){if(this.timer!==null){this.timer.cancel();this.timer=null;}},getManifest:function(layout)
{try{if(this.isDownloading){return;}
var self=this;if(typeof layout==='undefined'){layout=unescape(this.localstorage.getString("lay"));}
this.masterManifestURL=this.buildManifestURL();this.masterManifestURL+="?.intl=us";this.masterManifestURL+="&.pc=";this.masterManifestURL+="&.ysots="+this.localstorage.getString("ysots");this.masterManifestURL+="&.btns="+layout;if(!this.isPrefetchRequired(this.timetolive,this.masterManifestURL)){this.initCacheloaderPoll();return;}
this.stopCacheloaderPoll();var iosvc=yahooCC["@mozilla.org/network/io-service;1"].getService(yahooCI.nsIIOService);var mmChannel=iosvc.newChannel(this.masterManifestURL,0,null);var mmListener={stream:null,xml:"",yFileIO:null,onStartRequest:function(request,context){try{this.xml="";}catch(e){yahooError(e.message);}},onDataAvailable:function(request,context,inputStream,offset,count){try{if(this.stream==null){this.stream=yahooCC["@mozilla.org/scriptableinputstream;1"].createInstance(yahooCI.nsIScriptableInputStream);}
this.stream.init(inputStream);this.xml+=this.stream.read(count);}catch(e){yahooError(e.message);}},onStopRequest:function(request,context,statusCode){try{self.isDownloading=false;if(this.stream!=null){try{this.stream.close();}catch(e){}
this.stream=null;}
var http=request.QueryInterface(yahooCI.nsIHttpChannel);if(this.xml!=""&&http.status==0){if(this.yFileIO==null){this.yFileIO=yahooCC["@yahoo.com/fileio;1"].getService(yahooCI.nsIYahooFileIO2);}
var mmFile=this.yFileIO.getUserCacheDir();mmFile.appendRelativePath("mastermanifest.xml");this.yFileIO.writeFile(mmFile,this.xml);self.startPrefetcher(layout);}else{yahooDebug("empty Master Manifest");}}catch(ex){yahooError("YahooCache:getManifest(): "+ex.message);}}};this.isDownloading=true;mmChannel.asyncOpen(mmListener,null);}catch(e){yahooError("YahooCache:getManifest(): "+e.message);}},prefetchFromManifest:function(bForced)
{var content="";var parser=yahooCC["@mozilla.org/xmlextras/domparser;1"].createInstance(yahooCI.nsIDOMParser);try{var yFileIO=yahooCC["@yahoo.com/fileio;1"].getService(yahooCI.nsIYahooFileIO2);var manifestFile=yFileIO.getUserCacheDir();manifestFile.appendRelativePath("mastermanifest.xml");if(manifestFile.exists())
{var inStream=yahooCC["@mozilla.org/network/file-input-stream;1"].createInstance(yahooCI.nsIFileInputStream);inStream.init(manifestFile,0x01,0666,0);var handle=yahooCC["@mozilla.org/scriptableinputstream;1"].createInstance(yahooCI.nsIScriptableInputStream);handle.init(inStream);var size;while((size=inStream.available())){content+=handle.read(size);}
handle.close();var manifestXML=parser.parseFromString(content,"application/xml");if(manifestXML.tagName==="parserError")
{yahooDebug("Error in parsing Master Manifest XML");return;}
else
{var ysotsa=manifestXML.getElementsByTagName("ysots");if(ysotsa)
{this.confMgr.setCharValue("ysots",ysotsa[0].childNodes[0].nodeValue,true);}
var mmItems=manifestXML.getElementsByTagName("link");for(var idx=0;idx<mmItems.length;idx++)
{try{var resourceMap=this.getServerData(mmItems[idx].childNodes[0].nodeValue);var resourceXML=parser.parseFromString(resourceMap,"application/xml");this.prefetchURIs(resourceXML,bForced);}
catch(xmle){yahooError('XML : '+xmle.message);}}
var keyname="cacheloader.ytff";var value=this.getCurrentDate();this.mConfigMgr.setCharValue(keyname,value,true);}}}catch(e){yahooError(e.message);}
this.initCacheloaderPoll(3600);},prefetchURIs:function(rssXML,bForced)
{try
{if(rssXML.tagName==="parserError"){return;}
var resourceItems=rssXML.getElementsByTagName("link");for(var idy=0;idy<resourceItems.length;idy++)
{this.prefetchURI(resourceItems[idy].childNodes[0].nodeValue);}
this.stopPrefetcher();}catch(e){yahooError(e.message);}},startPrefetcher:function(btnIDs){try{if(!this.isPrefetchRunning&&!this.abortCacheloader){var self=this;var cb_PrefetchManifest={notify:function(timer){try{self.prefetchFromManifest(false);}catch(e){yahooError('startPrefetcher:'+e.message);}}};var one_timer=yahooCC["@mozilla.org/timer;1"].createInstance(yahooCI.nsITimer);one_timer.initWithCallback(cb_PrefetchManifest,this.first_time_delay*1000,yahooCI.nsITimer.TYPE_ONE_SHOT);this.fetchTimer.initWithCallback(cb_PrefetchManifest,this.fetch_frequency*1000,yahooCI.nsITimer.TYPE_REPEATING_PRECISE);this.isPrefetchRunning=true;}}catch(e){yahooError(" exception in fetch ::: "+e.message);}},stopPrefetcher:function(){try{if(this.fetchTimer!=null){this.fetchTimer.cancel();}
this.isPrefetchRunning=false;}catch(e){this.isPrefetchRunning=false;yahooError(e.message);}},getServerData:function(url)
{var data="";try{var iosvc=yahooCC["@mozilla.org/network/io-service;1"].getService(yahooCI.nsIIOService);var channel=iosvc.newChannel(url,0,null);var stream=channel.open();var fh=yahooCC["@mozilla.org/scriptableinputstream;1"].createInstance(yahooCI.nsIScriptableInputStream);fh.init(stream);var size=0;while((size=stream.available())){data+=fh.read(size);}
fh.close();fh=null;stream=null;}catch(e){yahooError(e);}
return data},convertToURI:function(url){try{var ioService=yahooCC["@mozilla.org/network/io-service;1"].getService(yahooCI.nsIIOService);return ioService.newURI(url,null,null);}catch(e){yahooError(e);return null;}},getHostName:function(URI){try{return URI.host;}catch(ex){return null;}},isPrefetchRequired:function(ttl,url){try{var lastFetched=null;var keyname="cacheloader.ytff";if(this.mConfigMgr.isKeyPresent(keyname)){lastFetched=new Date(this.mConfigMgr.getCharValue(keyname));}else{return true;}
var _now=new Date();var one_minute=1000*60;var _ttl=this.timetolive;var min_elapased=Math.ceil(((_now.getTime()-lastFetched.getTime())/one_minute));if(min_elapased>_ttl){return true;}
if(url){if(!this.isInBrowserCache(this.masterManifestURL)){return true;}
var ysots=this.confMgr.getCharValue("ysots");if(ysots!=this.localstorage.getString("ysots")){return true;}}}catch(ex){yahooError(ex.message);}
return false;},buildManifestURL:function(){var manifest_url="";try{var hash=this.localstorage.getObject("yahoo-toolbar-cacheldr.yhash");if(hash){hash=hash.wrappedJSObject.object;this.abortCacheloader=false;}
else{this.abortCacheloader=true;}
if(!this.abortCacheloader){if(hash.mlurl){manifest_url=hash.mlurl;}
if(hash.staledays){this.timetolive=hash.staledays*24*60;}}}catch(ex){yahooError(" error in buildManifestURL :: **** "+ex.message);}
return manifest_url;},getCurrentDate:function(){var d=new Date();return d.toUTCString();},openCacheEntry:function(url,mode){try
{var clientID="HTTP";var nsICache=Components.interfaces.nsICache;var nsCacheService=Components.classes["@mozilla.org/network/cache-service;1"];var service=nsCacheService.getService(Components.interfaces.nsICacheService);var session=service.createSession(clientID,nsICache.STORE_ON_DISK,true);var entry=session.openCacheEntry(url,mode,true);}catch(e){yahooError("openCacheEntry: "+e.message);}
return entry;},writeToCache:function(url,data){try
{var nsICache=Components.interfaces.nsICache;var key=url.toString();var outputEntry=this.openCacheEntry(key,nsICache.ACCESS_WRITE);var output=outputEntry.openOutputStream(0);var count=output.write(data,data.length);outputEntry.setMetaDataElement("size",data.length);outputEntry.setMetaDataElement("docshell:classified","1");outputEntry.setMetaDataElement("request-method","GET");outputEntry.setMetaDataElement("response-head","HTTP/1.1 200 OK\r\n"+"Date: "+Date()+"\r\n"+"P3P: policyref=\"http://p3p.yahoo.com/w3c/p3p.xml\", CP=\"CAO DSP COR CUR ADM DEV TAI PSA PSD IVAi IVDi CONi TELo OTPi OUR DELi SAMi OTRi UNRi PUBi IND PHY ONL UNI PUR FIN COM NAV INT DEM CNT STA POL HEA PRE GOV\"\r\n"+"Last-Modified: "+Date()+"\r\n"+"Accept-Ranges: bytes\r\n"+"Cache-Control: public, max-age=3600\r\n"+"Content-Type: text/html; charset=utf-8\r\n");outputEntry.setMetaDataElement("charset","UTF-8");output.close();outputEntry.markValid();outputEntry.close();}
catch(e)
{yahooError("writeToCache: "+e.message);}},classID:Components.ID("{E52264DC-F91A-11DD-BAF7-11F655D89593}"),contractID:"@yahoo.com/ycache;1",QueryInterface:XPCOMUtils.generateQI([Components.interfaces.nsIYahooCache])};if(XPCOMUtils.generateNSGetFactory)
var NSGetFactory=XPCOMUtils.generateNSGetFactory([YahooCache]);else
var NSGetModule=XPCOMUtils.generateNSGetModule([YahooCache]);