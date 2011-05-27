/**
 * Checks number of new mails for a UnitedInternet account.
 * Polls periodically in the background, and sends around a message
 * when there are new mails.
 *
 * Once you getMailCheckAccount(), the account will listen to "logged-in"/out
 * messages by itself, and starting the mail check as soon as the account
 * is logged in, and send "mail-check" notifications when there are news.
 * So, doing "getMailCheckAccount()" and send "do-login" is all you need to do
 * to start mail checks.
 *
 * The implementation is getting a bit complicated due to UnitedInternet's
 * login and mail server systems, so we have about 5 steps here:
 * LoginTokenServer:
 *    takes username/password
 *    returns token as credentials.
 *    (A token is as good as a password, but with a short or long expiry)
 * UAS:
 *   takes loginToken
 *   returns URL for ContextService
 * ContextService (= PACS = trinity-toolbar-rest):
 *   takes URL + token
 *   creates session
 *   returns session cookie and URL for RESTfulMail and
 *       URL+params for Webmail login
 * getFolderStats() (= RESTfulMail = folderQuota):
 *   takes session cookie
 *   returns list of folders with number of unread mail etc.
 * Webmail:
 *   takes params for login
 *   returns HTTP redirect to webpage (for normal browser) with webmail
 *       (either login page or already logged in, depending on user)
 *
 * We can save the loginToken (if longSession) in the profile.
 * The loginToken and the session can expire, so we may need to fall back.
 */

/**
 * Messages sent:
 * "mail-check"
 *    Means: New information about number of new/unread mails
 *    When: We polled the server (periodically) about new mails, here in background
 *    Parameter: {MailCheckAccount}
 *
 * "session-failed" (observed by login-logic.js)
 *    Parameter: emailAddress {String}, account {Account}
 *    Meaning: Our session expired or is not accepted
 *    When: A server function returned an error saying that our session (cookie)
 *      is no longer valid.
 */

const EXPORTED_SYMBOLS = [ "getMailCheckAccount" ];

Components.utils.import("resource://unitedtb/util/util.js");
Components.utils.import("resource://unitedtb/util/sanitizeDatatypes.js");
Components.utils.import("resource://unitedtb/util/fetchhttp.js");
Components.utils.import("resource://unitedtb/util/observer.js");
Components.utils.import("resource://unitedtb/email/login-logic.js");

var gStringBundle = new StringBundle("chrome://unitedtb/locale/email/email.properties");

/**
 * Known |MailCheckAccount|s. All of these will be polled for new mail
 * as soon as they are logged in.
 * This module is supporting several accounts, even though the UI doesn't yet.
 */
var gMailCheckAccounts = {};

/**
 * Returns the |MailCheckAccount| object for |emailAddress|.
 * If none exists yet, creates it.
 * Note: Implicitly start mail checks, see top of file.
 * @constructor
 */
function getMailCheckAccount(emailAddress)
{
  assert(emailAddress);
  if (gMailCheckAccounts[emailAddress])
    return gMailCheckAccounts[emailAddress];
  gMailCheckAccounts[emailAddress] = new MailCheckAccount(emailAddress);
  return gMailCheckAccounts[emailAddress];
}

function MailCheckAccount(emailAddress)
{
  assert(emailAddress);
  this._loginAccount = getAccount(emailAddress); // login-logic.js
  assert(this._loginAccount);
}
MailCheckAccount.prototype =
{
  // |Account| object from logic-logic.js
  _loginAccount : null,
  _newMailCount : 0,

  _poller : null, // nsITimer for mail poll
  _eTag : null,

  get emailAddress() { return this._loginAccount.emailAddress; },
  get isLoggedIn() { return this._loginAccount._isLoggedIn; },
  get newMailCount() { return this._newMailCount; },

  /**
   * If the user is logged in and wants to go to webmail, i.e. read the mail
   * on the UnitedInternet website, go to this URL (you may need to do POST).
   * @returns {
   *    url {String}
   *    httpMethod {String-enum} "GET" or "POST"
   *    mimetype {String}   Content-Type header to set in request, as upload type
   *    body {String}   body to send in request
   *  }
   */
  getWebmailPage : function()
  {
    var context = this._loginAccount.loginContext;
    return {
      url : context.webmailURL,
      httpMethod : context.webmailHTTPMethod,
      mimetype : context.webmailMimetype,
      body : context.webmailBody,
    };
  },

  _logout : function()
  {
    this._poller.cancel(); // stop polling
    this._poller = null;
    this._newMailCount = 0;
    this._eTag = null;
  },

  /**
   * Logs into server session and starts polling for new mails.
   * Result are "mail-check" messages.
   */
  _startMailCheck : function()
  {
    assert(this._loginAccount.isLoggedIn);
    var context = this._loginAccount.loginContext;
    assert(context.mailCheckBaseURL);

    this._mailPoll();
    var self = this;
    this._poller = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
    this._poller.initWithCallback(function() { self._mailPoll(); },
        context.mailCheckInterval * 1000, Ci.nsITimer.TYPE_REPEATING_SLACK);
  },
  _mailPoll : function()
  {
    try {
      assert(this._loginAccount.isLoggedIn);
      var self = this;
      getFolderStats(this._loginAccount.loginContext.mailCheckBaseURL,
          this._loginAccount.loginContext.mailIgnoreFolderTypes,
          this._eTag, this._newMailCount,
          function(newMailCount, eTag)
          {
            self._newMailCount = newMailCount;
            self._eTag = eTag;
            notifyGlobalObservers("mail-check", self);
          },
          function (e)
          {
            if (e.code == 403) // Forbidden, e.g. session expired
              notifyGlobalObservers("session-failed",
                  { emailAddress : self.emailAddress, account : self._loginAccount });
            else
              errorInBackend(e);
          });
    } catch (e) { errorInBackend(e); }
  }
}



/**
 * Called when user logged in or out.
 */
function onLoginStateChange(msg, obj)
{
  assert(obj.emailAddress);
  var acc = gMailCheckAccounts[obj.emailAddress];
  if (!acc) // not yet created by UI, so don't poll
    return;
  if (msg == "logged-in")
  {
    assert(acc.isLoggedIn);
    assert(!acc.newMailCount);
    acc._startMailCheck(); // will send another "mail-check" msg after server call
  }
  else if (msg == "logged-out")
  {
    acc._logout();
    notifyGlobalObservers("mail-check", acc);
  }
}

var globalObserver =
{
  notification : function(msg, obj)
  {
    if (msg == "logged-in" || msg == "logged-out")
      onLoginStateChange(msg, obj);
  },
}
registerGlobalObserver(globalObserver);



///////////////////////////////////////////////////////////////////////////
// Network functions

// (Do not use globals from here on, apart from gStringBundle and similar)

const kStandardHeaders =
    {
      "Accept" : "application/xml",
      "X-UI-App" : "Firefox-Toolbar/" + getExtensionFullVersion(),
    };

/**
 * folder step: Take URL for mail check and login token (?)
 * and return how many new mails are in each folder
 *
 * @param mailCheckBaseURL {String}
 * @param ignoreFolderTypes {Array of String} @see loginContext
 * @param successCallback {Function(newMailCount {Integer}, eTag {String})}
 *     newMailCount   how many new (currently all unread!) mails are in all folders
 *     eTag   Caching-mechanism for server's benefit, see "HTTP ETag"
 *
 */
function getFolderStats(mailCheckBaseURL, ignoreFolderTypes,
    eTag, lastNewMailCount,
    successCallback, errorCallback)
{
  assert(ignoreFolderTypes);
  var headers = !eTag ? kStandardHeaders :
        {
          "If-None-Match" : eTag,
          prototype : kStandardHeaders,
        };
  var fetch = new FetchHTTP(
      {
        url : mailCheckBaseURL + "FolderQuota?absoluteURI=false",
        method : "GET",
        headers : headers,
      },
  function(response) // success
  {
    assert(typeof(response) == "xml", gStringBundle.get("error.notXML"));
    assert(response.folderQuota, gStringBundle.get("error.badXML"));
    try {
      var newETag = fetch.getResponseHeader("ETag");
    } catch (e) { debug("Getting ETag failed: " + e); }
    //debug(response.toString());

    successCallback(countNewMailsInFolder(response.folderQuota,
                                          ignoreFolderTypes), newETag);
  },
  function (e)
  {
    if (e.code == 304) // not modified
    {
      try {
        var newETag = fetch.getResponseHeader("ETag");
        if (eTag != newETag)
          debug("server says 'not modified', but sends different eTag");
      } catch (e) { debug("Getting ETag failed: " + e); }
      successCallback(lastNewMailCount, newETag);
    }
    else
      errorCallback(e);
  });
  fetch.start();
}

/**
 * Recursive function for getFolderStats() that
 * adds up the number of new/unread mails in each folder,
 * including subfolders
 * @param xFolders {XML} A list of <folderQuota> elements
 * @param ignoreFolderTypes {Array of String} @see LoginContext
 * @returns {Integer} number of new mails in this folder and all subfolders
 */
function countNewMailsInFolder(xFolders, ignoreFolderTypes)
{
  var result = 0;
  assert(ignoreFolderTypes);
  for each (let folder in xFolders)
  {
    //debug("folder " + sanitize.string(folder.folderName) +
    //    " type " + sanitize.string(folder.folderType) +
    //    " has " + sanitize.integer(folder.totalMessages) +
    //    " of which " + sanitize.integer(folder.unreadMessages) + " are unread");
    if (arrayContains(ignoreFolderTypes, sanitize.string(folder.folderType)))
    {
      //debug("ignoring folder " + sanitize.string(folder.folderName));
      continue;
    }
    result += sanitize.integer(folder.unreadMessages);
    if (folder.subFolders)
      result += countNewMailsInFolder(folder.subFolders.folderQuota, ignoreFolderTypes);
  }
  return result;
}
