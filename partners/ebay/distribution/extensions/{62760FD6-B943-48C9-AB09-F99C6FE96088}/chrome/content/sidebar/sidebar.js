/* Copyright (C) 2007-2011 eBay Inc. All Rights Reserved. */const Cc=Components.classes;const Ci=Components.interfaces;const Ce=Components.Exception;const Cr=Components.results;const Cu=Components.utils;var EbayCompanion=parent.EbayCompanion;var Sidebar={init:function(){try{let that=this;this._observers=new EbayCompanion.Observers;this._observers.add(function(){that.setConnected(true);},"ebay-account-logged-in");this._observers.add(function(){that.setConnected(false);that._showSignedOutNotification();EbayCompanion.InformationNotificationHelper.dismissNotification(EbayCompanion.InformationNotificationHelper.TERMS_CONDITIONS_CHANGED_NOTIFICATION);EbayCompanion.InformationNotificationHelper.dismissNotification(EbayCompanion.InformationNotificationHelper.TERMS_CONDITIONS_NOTIFICATION);that.clearNotificationBox("gs-ebay-signed-out-information-notificationbox");},"ebay-account-logged-out");this._observers.add(function(){that._resetCurrentTabFilter();},"ebay-reset-current-tab-filter");this._observers.add(function(subject,topic,data){that._forceFilter(data);},"ebay-apply-tab-filter");this._observers.add(function(subject,topic,data){that.applyFilter(true);},"ebay-sidebar-force-apply-filter");this._observers.add(function(subject,topic,data){that.forceShowItemDetails(subject,data);},"ebay-show-item-details");this._observers.add(function(subject,topic,data){that.forceHideItemDetails(subject);},"ebay-hide-item-details");this._observers.add(function(subject,topic,data){that.forceShowDealDetails(subject,data);},"ebay-show-deal-details");this._observers.add(function(subject,topic,data){that.forceHideDealDetails(subject);},"ebay-hide-deal-details");Sidebar.DragNDropManager.init();this._initNotifications();if("undefined"==typeof(EbayCompanion.StateHelper)){EbayCompanion._importModule("helpers/stateHelper.js");}
EbayCompanion.StateHelper.stopKeepTimer();let moreTabEnabled=EbayCompanion.Constants.prefBranch.get("moreTabEnabled");this._enableMoreTab(moreTabEnabled);EbayCompanion.Constants.prefBranch.addObserver(function(aSubject,aTopic,aData){let newValue=EbayCompanion.Constants.prefBranch.get("moreTabEnabled");that._enableMoreTab(newValue);},"moreTabEnabled");EbayCompanion.Constants.prefBranch.addObserver(function(aSubject,aTopic,aData){that._enableDealsUI(true);},"chosenSite");EbayCompanion.Constants.prefBranch.addObserver(function(aSubject,aTopic,aData){that._enableDealsUI(true);},"useRegistrationSite");let connected=EbayCompanion.Datasource.activeAccount()!=null;this.setConnected(connected);let toolbarButton=top.document.getElementById("ec-toolbar-button");if(toolbarButton){toolbarButton.glowing=false;}
EbayCompanion.updateButtonTooltip();this._addFocusHandler();}
catch(e){EbayCompanion.Logger.exception(e);}},uninit:function(){try{EbayCompanion.updateButtonTooltip();this._setStateTimer();let that=this;EbayCompanion.Constants.prefBranch.removeObserver(function(aSubject,aTopic,aData){let newValue=EbayCompanion.Constants.prefBranch.get("moreTabEnabled");that._enableMoreTab(newValue);},"moreTabEnabled");EbayCompanion.Constants.prefBranch.removeObserver(function(aSubject,aTopic,aData){that._enableDealsUI(true);},"chosenSite");EbayCompanion.Constants.prefBranch.removeObserver(function(aSubject,aTopic,aData){that._enableDealsUI(true);},"useRegistrationSite");this._observers.removeAll();this._removeFocusHandler();}
catch(e){EbayCompanion.Logger.exception(e);}},_enableMoreTab:function(aEnableTab){let moreTab=document.getElementById("gs-ebay-sidebar-more-tab");moreTab.setAttribute("collapsed",!aEnableTab);},_setStateTimer:function(){let windowMediator=Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);let windowEnumerator=windowMediator.getEnumerator("navigator:browser");let sidebarInstance=0;let win=null;while(windowEnumerator.hasMoreElements()){win=windowEnumerator.getNext();if(win.EbayCompanion.isSidebarOpen()){sidebarInstance++;}}
if(0==sidebarInstance){EbayCompanion.StateHelper.startKeepTimer();}},setConnected:function(connected){let statusDeck=document.getElementById("gs-ebay-sidebar-status-deck");let sidebarEndedTab=document.getElementById("gs-ebay-sidebar-ended-tab");let sidebarActiveTab=document.getElementById("gs-ebay-sidebar-active-tab");let sidebarTabbox=document.getElementById("gs-ebay-sidebar-tabbox");this._enableDealsUI();statusDeck.selectedIndex=connected?1:0;sidebarTabbox.selectedIndex=0;sidebarEndedTab.selectedIndex=0;sidebarActiveTab.selectedIndex=0;if(connected){let accordion=document.getElementById("gs-ebay-sidebar-more-list");let greetingBroadcaster=document.getElementById("greeting-broadcaster");let account=EbayCompanion.Datasource.activeAccount();greetingBroadcaster.setAttribute("username",account.get("userId"));greetingBroadcaster.setAttribute("feedbackscore",account.get("feedbackRating"));let selectedTab=EbayCompanion.StateHelper.getSelectedTab();let selectedFilter=EbayCompanion.StateHelper.getSelectedFilter();let accordionStatus=EbayCompanion.StateHelper.accordionStatus;let itemDetails=EbayCompanion.StateHelper.getItemDetails();let dealDetails=EbayCompanion.StateHelper.getDealDetails();this._setFilterSelection(selectedTab,selectedFilter);accordion.setAccordionStatus(accordionStatus);this.applyFilter(null,true);this.restoreDetails(itemDetails,dealDetails);EbayCompanion.WarningNotificationHelper.dismissNotification(EbayCompanion.WarningNotificationHelper.SIGNED_OUT_WARNING);EbayCompanion.WarningNotificationHelper.dismissNotification(EbayCompanion.WarningNotificationHelper.LOGIN_FAILED_WARNING);EbayCompanion.WarningNotificationHelper.dismissNotification(EbayCompanion.WarningNotificationHelper.SECURITY_SIGN_OUT_WARNING);this.clearNotificationBox("gs-ebay-signed-out-warning-notificationbox");EbayCompanion.InformationNotificationHelper.dismissNotification(EbayCompanion.InformationNotificationHelper.TERMS_CONDITIONS_NOTIFICATION);this.clearNotificationBox("gs-ebay-signed-out-information-notificationbox");}},_showSignedOutNotification:function(){let notification=new EbayCompanion.Notification(EbayCompanion.WarningNotificationHelper.SIGNED_OUT_WARNING);notification.set("content",EbayCompanion.Constants.stringBundle.getString("ecSidebar.warning.signout"));notification.set("priority",1);EbayCompanion.WarningNotificationHelper.queueNotification(notification);},_resetCurrentTabFilter:function(){let activeTab=document.getElementById("gs-ebay-sidebar-active-tab");let currentTab;if(activeTab.hasAttribute("selected")){currentTab=activeTab;}else{currentTab=document.getElementById("gs-ebay-sidebar-ended-tab");}
currentTab.selectedIndex=0;this.applyFilter(true);},connectCommand:function(aEvent){try{let useSandbox=false;let debuggingEnabled=EbayCompanion.Constants.prefBranch.get("debugging.enabled");if(debuggingEnabled&&aEvent.button==2){useSandbox=true;}
let pageName=useSandbox?"sandboxLoginPage":"loginPage";EbayCompanion.openPage(aEvent,"connectButton",pageName,{});}catch(e){EbayCompanion.Logger.exception(e);}},itemContextClick:function(aEvent,aAction){let selectedOption=aEvent.target;let bindingParent=document.getBindingParent(selectedOption);let item=bindingParent.item;let itemId=item.get("itemId");let itemTransaction=item.transaction;let userId=EbayCompanion.Datasource.activeAccount().get("userId");let userIsSeller=(item.get("sellerUserId").toLowerCase()==userId.toLowerCase());let counterpartId=null;let url=null;let forceNewTab=false;let args;let button=aEvent.button;switch(aAction){case'similar':case'revise':case'promote':case'makeOffer':case'reviewOffers':args={itemid:itemId};break;case"orderDetails":args={itemid:itemId};url=EbayCompanion.Constants.getUrl("itemContext",aAction,args);if(item.transaction){url+="&transid="+item.transaction.get("transactionId");}
break;case'viewOther':case'userFeedback':if(userIsSeller){counterpartId=itemTransaction.get("buyerUserId");}else{counterpartId=item.get("sellerUserId");}
args={userid:counterpartId};break;case'askQuestion':args={requested:item.get("sellerUserId"),iid:itemId};break;case'contactBuyer':args={requested:itemTransaction.get("buyerUserId"),iid:itemId};break;case'find':var title=escape(item.get("title"));args={itemid:itemId,query:title};break;case'listing':args={itemid:itemId};forceNewTab=true;break;case'removeItem':if(typeof(EbayCompanion.ApiCoordinator)=="undefined"){EbayCompanion._importModule("apiCoordinator.js");}
if(typeof(EbayCompanion.Item)=="undefined"){EbayCompanion._importModule("objects/item.js");}
let itemState=item.getCurrentState(userId);switch(itemState){case EbayCompanion.Item.ITEM_STATE_BEST_OFFER_ITEM_WON:case EbayCompanion.Item.ITEM_STATE_BUYING_ITEM_WON:EbayCompanion.ApiCoordinator.removeFromWonList(item);break;case EbayCompanion.Item.ITEM_STATE_BUYING_ITEM_LOST:EbayCompanion.ApiCoordinator.removeFromDidntWinList(itemId);break;case EbayCompanion.Item.ITEM_STATE_WATCHING:case EbayCompanion.Item.ITEM_STATE_WATCHING_BEST_OFFER:case EbayCompanion.Item.ITEM_STATE_WATCHING_CLASSIFIED_AD:EbayCompanion.ApiCoordinator.removeFromWatchList(itemId);break;}
return;break;}
if(!url){url=EbayCompanion.Constants.getUrl("itemContext",aAction,args);}
EbayCompanion.openRawURL(url,aEvent,forceNewTab);aEvent.stopPropagation();},dealContextClick:function(aEvent,aAction){let selectedOption=aEvent.target;let bindingParent=document.getBindingParent(selectedOption);let deal=bindingParent.deal;let itemId=deal.get("itemId");let args;args={itemid:itemId};let url=EbayCompanion.Constants.getUrl("dealClick",aAction,args);EbayCompanion.openRawURL(url,aEvent,true);aEvent.stopPropagation();},switchToTab:function(aTabIndex){let sidebarTabBox=document.getElementById("gs-ebay-sidebar-tabbox");sidebarTabBox.selectedIndex=aTabIndex;this.applyFilter();},forceShowItemDetails:function(aItem,aSkip){let itemList=document.getElementById("gs-ebay-sidebar-item-list");itemList.doShowItemDetails(aItem,aSkip);},forceHideItemDetails:function(aParams){let itemList=document.getElementById("gs-ebay-sidebar-item-list");itemList.doHideItemDetails(aParams.callback,aParams.animateListDisplay,aParams.skipAnimation);},forceShowDealDetails:function(aDeal,aSkip){let moreList=document.getElementById("gs-ebay-sidebar-more-list");moreList.doShowDealDetails(aDeal,aSkip);},forceHideDealDetails:function(aParams){let moreList=document.getElementById("gs-ebay-sidebar-more-list");moreList.doHideDealDetails(aParams.callback,aParams.animateListDisplay,aParams.skipAnimation);},restoreDetails:function(aItemDetails,aDealDetails){if(aItemDetails){let itemList=document.getElementById("gs-ebay-sidebar-item-list");let itemNode=itemList.findItem(aItemDetails);if(itemNode){itemList.showItemDetails(itemNode,true);}}
if(aDealDetails){let moreList=document.getElementById("gs-ebay-sidebar-more-list");let dealNode=moreList.findDeal(aDealDetails);if(dealNode){moreList.showDealDetails(dealNode,true);}}},applyFilter:function(aPreventPropagation,aSkipAnimation){try{let connected=EbayCompanion.Datasource.activeAccount()!=null;if(connected){let listDeck=document.getElementById("gs-ebay-sidebar-list-deck");let itemList=document.getElementById("gs-ebay-sidebar-item-list");let moreTabAccordion=document.getElementById("gs-ebay-sidebar-more-list");let filterSelection=this._getFilterSelection();let filterPrefix=filterSelection[0];let filterSuffix=filterSelection[1]?filterSelection[1]:"all";let filterName=filterPrefix+"."+filterSuffix;let filter;let filterNotificationKey=filterPrefix+".title."+filterSuffix;if(-1!=filterSuffix.indexOf("all")){filterNotificationKey=null;}
EbayCompanion.StateHelper.setCurrentState(filterPrefix,filterSuffix);EbayCompanion.WarningNotificationHelper.dismissFilterNotifications();filter=this._getFilterFunction(filterName);if(-1==filterPrefix.indexOf("more")){let activeTab=document.getElementById("gs-ebay-sidebar-active-tab");let emptyListText=EbayCompanion.Constants.stringBundle.getString("ecSidebar.tab."+filterName+".null");let emptyListLinkPage="homePage";let openEmptyListLinkPage=function(event){EbayCompanion.openPage(event,"emptyListText",emptyListLinkPage,{});};if(-1!=filterPrefix.indexOf("ended")){EbayCompanion.WarningNotificationHelper.dismissNotification(EbayCompanion.WarningNotificationHelper.ITEM_MOVED_TO_ENDED_TAB_WARNING);}
itemList.reverseSort=!activeTab.hasAttribute("selected");itemList.applyFilter(filter,aSkipAnimation);itemList.setEmptyListText(emptyListText,[openEmptyListLinkPage]);if(moreTabAccordion.detailsShown){let animateTransition=function(){itemList.hideContainer();listDeck.selectedIndex=0;itemList.hideItemDetails(null,true);};moreTabAccordion.hideDealDetails(animateTransition);}else{listDeck.selectedIndex=0;}}else{EbayCompanion.WarningNotificationHelper.dismissNotification(EbayCompanion.WarningNotificationHelper.ITEM_MOVED_TO_ENDED_TAB_WARNING);if(itemList.detailsShown){let animateTransition=function(){moreTabAccordion.hideContainer();listDeck.selectedIndex=1;moreTabAccordion.hideDealDetails(null,true);};itemList.hideItemDetails(animateTransition);}else{listDeck.selectedIndex=1;}}
if(!aPreventPropagation){this._observers.notify(null,"ebay-apply-tab-filter",filterName);}
if(filterNotificationKey&&0==listDeck.selectedIndex){let type;let numberElements=itemList.itemList.filteredItems.length;switch(filterNotificationKey){case"active.title.buying":type=EbayCompanion.WarningNotificationHelper.BIDDING_FILTER_WARNING;break;case"active.title.watching":type=EbayCompanion.WarningNotificationHelper.WATCHING_FILTER_WARNING;break;case"active.title.selling":type=EbayCompanion.WarningNotificationHelper.SELLING_FILTER_WARNING;break;case"ended.title.watching":type=EbayCompanion.WarningNotificationHelper.WATCHED_FILTER_WARNING;break;case"ended.title.won":type=EbayCompanion.WarningNotificationHelper.WON_FILTER_WARNING;break;case"ended.title.lost":type=EbayCompanion.WarningNotificationHelper.LOST_FILTER_WARNING;break;case"ended.title.sold":type=EbayCompanion.WarningNotificationHelper.SOLD_FILTER_WARNING;break;case"ended.title.unsold":type=EbayCompanion.WarningNotificationHelper.UNSOLD_FILTER_WARNING;break;}
if(typeof(EbayCompanion.Notification)=="undefined"){EbayCompanion._importModule("objects/notification.js");}
let notification=new EbayCompanion.Notification(type);notification.set("content",EbayCompanion.Constants.stringBundle.getString("ecSidebar.tab."+filterNotificationKey,[numberElements]));notification.set("priority",1);EbayCompanion.WarningNotificationHelper.queueNotification(notification);}
EbayCompanion.AlertsService.applySecondaryAlerts();}}catch(e){EbayCompanion.Logger.exception(e);}},_forceFilter:function(aFilter){let filterSelection=this._getFilterSelection();let filterPrefix=filterSelection[0];let filterSuffix=filterSelection[1]?filterSelection[1]:"all";let filterName=filterPrefix+"."+filterSuffix;if(filterName!=aFilter){let listDeck=document.getElementById("gs-ebay-sidebar-list-deck");let moreTabAccordion=document.getElementById("gs-ebay-sidebar-more-list");let filter=null;filterName=aFilter;filterSelection=aFilter.split(".");filterPrefix=filterSelection[0];filterSuffix=filterSelection[1];this._setFilterSelection(filterPrefix,filterSuffix);filter=this._getFilterFunction(filterName);if(-1==filterPrefix.indexOf("more")){let itemList=document.getElementById("gs-ebay-sidebar-item-list");let activeTab=document.getElementById("gs-ebay-sidebar-active-tab");let emptyListText=EbayCompanion.Constants.stringBundle.getString("ecSidebar.tab."+filterName+".null");let emptyListLinkPage="homePage";let openEmptyListLinkPage=function(event){EbayCompanion.openPage(event,"emptyListText",emptyListLinkPage,{});}
itemList.reverseSort=!activeTab.hasAttribute("selected");itemList.applyFilter(filter);itemList.setEmptyListText(emptyListText,[openEmptyListLinkPage]);listDeck.selectedIndex=0;}else{listDeck.selectedIndex=1;}}},_getFilterSelection:function(){let activeTab=document.getElementById("gs-ebay-sidebar-active-tab");let endedTab=document.getElementById("gs-ebay-sidebar-ended-tab");let moreTab=document.getElementById("gs-ebay-sidebar-more-tab");let filterPrefix;if(activeTab.hasAttribute("selected")){filterPrefix="active";}else if(endedTab.hasAttribute("selected")){filterPrefix="ended";}else{filterPrefix="more";}
let filterSuffix;let menu=document.getElementById(filterPrefix+"-filter-menupopup");if(menu){let menuItems=menu.childNodes;for(let i=0;i<menuItems.length;i++){if(menuItems[i].hasAttribute("checked")){filterSuffix=menuItems[i].value;break;}}}
return[filterPrefix,filterSuffix];},_setFilterSelection:function(aTab,aFilter){let tabToSelect;let tabsToUnselect;let menuToSelect;let menusToUnselect;let activeTab=document.getElementById("gs-ebay-sidebar-active-tab");let endedTab=document.getElementById("gs-ebay-sidebar-ended-tab");let moreTab=document.getElementById("gs-ebay-sidebar-more-tab");if(aTab.indexOf("active")!=-1){tabToSelect=activeTab;tabsToUnselect=[endedTab,moreTab];menuToSelect="active";menusToUnselect=["ended","more"];}else if(aTab.indexOf("ended")!=-1){tabToSelect=endedTab;tabsToUnselect=[activeTab,moreTab];menuToSelect="ended";menusToUnselect=["active","more"];}else{tabToSelect=moreTab;tabsToUnselect=[activeTab,endedTab];menuToSelect="more";menusToUnselect=["active","ended"];}
let menu;let menuItems;tabToSelect.setAttribute("selected",true);tabToSelect.focus();tabToSelect.parentNode.selectedTab=tabToSelect;menu=document.getElementById(menuToSelect+"-filter-menupopup");if(menu){menuItems=menu.childNodes;for(let i=0;i<menuItems.length;i++){if(menuItems[i].value==aFilter){menuItems[i].setAttribute("checked",true);}else{menuItems[i].removeAttribute("checked");}}}
for each(let tabToUnselect in tabsToUnselect){tabToUnselect.removeAttribute("selected");for each(let menuToUnselect in menusToUnselect){menu=document.getElementById(menuToUnselect+"-filter-menupopup");if(menu){menuItems=menu.childNodes;for(let i=0;i<menuItems.length;i++){menuItems[i].removeAttribute("checked");}}}}},_getFilterFunction:function(aFilterName){let filter;let activeTab=document.getElementById("gs-ebay-sidebar-active-tab");let endedTab=document.getElementById("gs-ebay-sidebar-ended-tab");let dataSource=EbayCompanion.Datasource;let userId=dataSource.activeAccount().get("userId");if(typeof(EbayCompanion.Item)=="undefined"){EbayCompanion._importModule("objects/item.js");}
switch(aFilterName){case"active.all":endedTab.selectedIndex=0;filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return!item.get("isEnded")&&timeLeft>0;};break;case"active.buying":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return!item.get("isEnded")&&timeLeft>0&&(item.type==EbayCompanion.Item.ITEM_TYPE_BIDDING||item.type==EbayCompanion.Item.ITEM_TYPE_BEST_OFFER);}
break;case"active.watching":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return!item.get("isEnded")&&timeLeft>0&&item.get("sellerUserId").toLowerCase()!=userId.toLowerCase()&&item.get("userMaxBid")==0&&item.get("type")==EbayCompanion.Item.ITEM_TYPE_WATCHING;}
break;case"active.selling":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return!item.get("isEnded")&&timeLeft>0&&item.get("sellerUserId").toLowerCase()==userId.toLowerCase();}
break;case"ended.all":activeTab.selectedIndex=0;filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return item.get("isEnded")||timeLeft==0;};break;case"ended.watching":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return(item.get("isEnded")||timeLeft==0)&&item.get("sellerUserId").toLowerCase()!=userId.toLowerCase()&&item.get("userMaxBid")==0&&item.get("userQuantityWinning")==0&&item.get("type")==EbayCompanion.Item.ITEM_TYPE_WATCHING;}
break;case"ended.won":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return(item.get("isEnded")||timeLeft==0)&&item.get("userQuantityWinning")>0&&item.get("type")==EbayCompanion.Item.ITEM_TYPE_WON;}
break;case"ended.lost":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return((item.get("isEnded")||timeLeft==0)&&item.get("sellerUserId").toLowerCase()!=userId.toLowerCase()&&item.get("userMaxBid")>0&&item.get("userQuantityWinning")==0)||item.get("type")==EbayCompanion.Item.ITEM_TYPE_LOST;}
break;case"ended.sold":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return(item.get("isEnded")||timeLeft==0)&&item.get("sellerUserId").toLowerCase()==userId.toLowerCase()&&item.get("quantitySold")>0&&item.get("type")==EbayCompanion.Item.ITEM_TYPE_SOLD;}
break;case"ended.unsold":filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return((item.get("isEnded")||timeLeft==0)&&item.get("sellerUserId").toLowerCase()==userId.toLowerCase()&&item.get("quantitySold")==0)||item.get("type")==EbayCompanion.Item.ITEM_TYPE_UNSOLD;}
break;default:endedTab.selectedIndex=0;activeTab.selectedIndex=0;filter=function(item){let endTime=item.get("endTime");let ebayTime=dataSource.getEbayTime().getTime();let timeLeft=Math.max(0,endTime-ebayTime);return!item.get("isEnded")&&timeLeft>0;};break;}
return filter;},_initNotifications:function(){let that=this;if(typeof(EbayCompanion.WarningNotificationHelper)=="undefined"){EbayCompanion._importModule("helpers/warningNotificationHelper.js");}
if(typeof(EbayCompanion.InformationNotificationHelper)=="undefined"){EbayCompanion._importModule("helpers/informationNotificationHelper.js");}
this._observers.add(function(aSubject){let notificationBoxId="gs-ebay-warning-notificationbox";let connected=EbayCompanion.Datasource.activeAccount()!=null;if(aSubject.get("type")==EbayCompanion.WarningNotificationHelper.SIGNED_OUT_WARNING||aSubject.get("type")==EbayCompanion.WarningNotificationHelper.SECURITY_SIGN_OUT_WARNING||(!connected&&aSubject.get("type")==EbayCompanion.WarningNotificationHelper.LOGIN_FAILED_WARNING)){notificationBoxId="gs-ebay-signed-out-warning-notificationbox";}
that._showPendingNotification(notificationBoxId,aSubject);},"ebay-warning-notification");this._observers.add(function(aSubject){let notificationBoxId="gs-ebay-information-notificationbox";let connected=EbayCompanion.Datasource.activeAccount()!=null;let signedOutNotfication=(aSubject.get("type")==EbayCompanion.InformationNotificationHelper.TERMS_CONDITIONS_CHANGED_NOTIFICATION||aSubject.get("type")==EbayCompanion.InformationNotificationHelper.TERMS_CONDITIONS_NOTIFICATION)&&!connected;if(signedOutNotfication){notificationBoxId="gs-ebay-signed-out-information-notificationbox";}
that._showPendingNotification(notificationBoxId,aSubject);},"ebay-information-notification");this._observers.add(function(aSubject,aTopic,aData){that.clearNotificationBox("gs-ebay-warning-notificationbox");that.clearNotificationBox("gs-ebay-signed-out-warning-notificationbox");},"ebay-clear-warning-notificationbox");this._observers.add(function(aSubject,aTopic,aData){that.clearNotificationBox("gs-ebay-information-notificationbox");that.clearNotificationBox("gs-ebay-signed-out-information-notificationbox");},"ebay-clear-information-notificationbox");let warnNotificationBox=document.getElementById("gs-ebay-warning-notificationbox");warnNotificationBox.queueHelper=EbayCompanion.WarningNotificationHelper;let signedOutWarnNotificationBox=document.getElementById("gs-ebay-signed-out-warning-notificationbox");signedOutWarnNotificationBox.queueHelper=EbayCompanion.WarningNotificationHelper;let infoNotificationBox=document.getElementById("gs-ebay-information-notificationbox");infoNotificationBox.queueHelper=EbayCompanion.InformationNotificationHelper;let signedOutInfoNotificationBox=document.getElementById("gs-ebay-signed-out-information-notificationbox");signedOutInfoNotificationBox.queueHelper=EbayCompanion.InformationNotificationHelper;if(!EbayCompanion.Constants.isFirefox4&&EbayCompanion.Constants.getOperatingSystem()=="WINDOWS"){warnNotificationBox.setAttribute("xpFF3",true);signedOutWarnNotificationBox.setAttribute("xpFF3",true);infoNotificationBox.setAttribute("xpFF3",true);signedOutInfoNotificationBox.setAttribute("xpFF3",true);}else if(EbayCompanion.Constants.isFirefox4){warnNotificationBox.setAttribute("FF4",true);signedOutWarnNotificationBox.setAttribute("FF4",true);infoNotificationBox.setAttribute("FF4",true);signedOutInfoNotificationBox.setAttribute("FF4",true);}
EbayCompanion.InformationNotificationHelper.showPendingNotifications();EbayCompanion.WarningNotificationHelper.showPendingNotifications();},_showPendingNotification:function(aNotificationBoxId,aNotification){try{let notificationBox=document.getElementById(aNotificationBoxId);let that=this;let sidebarTabBox=document.getElementById("gs-ebay-sidebar-tabbox");if(aNotification.get("type")==EbayCompanion.WarningNotificationHelper.ITEM_MOVED_TO_ENDED_TAB_WARNING){let itemList=document.getElementById("gs-ebay-sidebar-item-list");if(itemList.detailsShown){that.forceHideItemDetails({callback:null,animateListDisplay:true});}
if(sidebarTabBox&&sidebarTabBox.selectedIndex==1){EbayCompanion.WarningNotificationHelper.dismissNotification(EbayCompanion.WarningNotificationHelper.ITEM_MOVED_TO_ENDED_TAB_WARNING);return;}}
if(notificationBox){if(null!=notificationBox.currentNotification){if(notificationBox.currentNotification.notificationType
!=aNotification.get("type")){notificationBox.removeAllNotifications(true);notificationBox.appendCustomNotification(aNotification);}}else{notificationBox.appendCustomNotification(aNotification);}}}catch(e){EbayCompanion.Logger.exception(e);}},clearNotificationBox:function(aNotificationBoxId){try{let notificationBox=document.getElementById(aNotificationBoxId);if(notificationBox&&notificationBox.allNotifications&&notificationBox.allNotifications.length>0){notificationBox.removeAllNotifications(true);}}catch(e){EbayCompanion.Logger.exception(e);}},_addFocusHandler:function(){let sidebar=document.getElementById("ebayCompanionSidebar");this._handleFocusClick=function(aEvent){if("ebaysearchbox"!=aEvent.target.localName){aEvent.target.focus();}}
sidebar.addEventListener("click",this._handleFocusClick,false);},_removeFocusHandler:function(){let sidebar=document.getElementById("ebayCompanionSidebar");sidebar.removeEventListener("click",this._handleFocusClick,false);},_enableDealsUI:function(aPrefChange){let displayDeals=false;let dealsAccordion=document.getElementById("gs-ebay-sidebar-deals-list");let prefService=EbayCompanion.Constants.rootPrefService;let language=prefService.getCharPref("general.useragent.locale").toUpperCase();let languageArray=language.split("-");let siteId=EbayCompanion.Constants.siteIdForSite(EbayCompanion.Datasource.homeSite());if(languageArray[0]=="EN"&&siteId==0||languageArray[0]=="EN"&&siteId==3||languageArray[0]=="EN"&&siteId==15||languageArray[0]=="EN"&&siteId==2||languageArray[0]=="DE"&&siteId==77||languageArray[0]=="FR"&&siteId==210){displayDeals=true;}
if(displayDeals){dealsAccordion.removeAttribute("collapsed");EbayCompanion.Constants.prefBranch.set("enable.deals.api.requests",true);if(aPrefChange){EbayCompanion.ApiCoordinator.pingDealsAPI();}}else{dealsAccordion.setAttribute("collapsed",true);EbayCompanion.Constants.prefBranch.set("enable.deals.api.requests",false);}},}