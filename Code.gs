function makeRequest(code) {
  var salesforceService = getSalesforceService();
  let url =
    "https://INSTANCE.my.salesforce.com/services/data/v51.0/sobjects/Account/";
  var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: "Bearer " + salesforceService.getAccessToken(),
    },
  });
  let json = JSON.parse(response);
  Logger.log(json);
}

function logRedirectUri() {
  let service = getSalesforceService();
  Logger.log(service.getRedirectUri());
}

function getSalesforceService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return (
    OAuth2.createService("salesforce")
      // Find endpoints here -> https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_endpoints.htm&type=5
      .setAuthorizationBaseUrl(
        "https://login.salesforce.com/services/oauth2/authorize"
      )
      .setTokenUrl("https://login.salesforce.com/services/oauth2/token")

      // Set the client ID and secret
      .setClientId("CLIENT_ID")
      .setClientSecret("CLIENT_SECRET")

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction("authCallback")

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request.
      // Find scopes here -> https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_tokens_scopes.htm&type=5
      .setScope("full")

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      .setParam("login_hint", Session.getEffectiveUser().getEmail())

      // Requests offline access.
      .setParam("access_type", "offline")

      // Consent prompt is required to ensure a refresh token is always
      // returned when requesting offline access.
      .setParam("prompt", "consent")
  );
}

function showSidebar() {
  let salesforceService = getSalesforceService();
  if (!salesforceService.hasAccess()) {
    let authorizationUrl = salesforceService.getAuthorizationUrl();
    return authorizationUrl;
  } else {
  }
}

function authCallback(request) {
  let salesforceService = getSalesforceService();
  let isAuthorized = salesforceService.handleCallback(request);
  if (isAuthorized) {
    Logger.log("Success!");
    return HtmlService.createHtmlOutput(
      "<p>Successfully authenticated, please close this page.</p>"
    );
  } else {
    Logger.log("Failure!");
    return HtmlService.createHtmlOutput(
      "<p>Something went wrong. Please referesh and try again.</p>"
    );
  }
}

// Allows separate html pages to be included
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Initializes web app
function doGet() {
  return HtmlService.createTemplateFromFile("index").evaluate();
}
