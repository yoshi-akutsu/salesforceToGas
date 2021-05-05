// URL Encodes spaces as %20 for use in API calls
function removeSpaces(text) {
  let letters = text.split("");
  for (let i = 0; i < letters.length; i++) {
    if (letters[i] == " ") {
      letters[i] = "%20";
    }
  }
  return letters.join("");
}

// Makes requests to the Salesforce REST API based on criteria
function makeRequest(searchTerm, searchType, object, recordTypeId) {
  var salesforceService = getSalesforceService();

  let orgBase = "https://ORGBASE.my.salesforce.com/";
  let url;

  if (searchType == "search") {
    url = "https://ORGBASE.my.salesforce.com/services/data/v51.0/parameterizedSearch/?q=" + removeSpaces(searchTerm) + "&sobject=" + object;
    if (recordTypeId) {
      url += "&" + object + ".where=RecordTypeId='" + recordTypeId + "'";
    } 
  }
  else if (searchType == "applications") {
    // SELECT Id, Student__c FROM Application__c WHERE Student__c = '0033h00000DtC43AAF'
    url = "https://ORGBASE.my.salesforce.com/services/data/v51.0/query/?q=select+id,+student__c,+Application_Type__c,+CSS_Profile_Sent__c,+Due_Date__c,+FAFSA_Sent__c,+Institution__c,+LOR_Sent__c,+Outcome__c,+Portfolio_Instructions__c,+Portfolio_Sent__c,+Program__c,+Submitted__c,+Supplemental_Essays_Completed__c,+Testing_Sent__c,+Transcripts_Sent__c,+Institution__r.Name+from+application__c+where+student__c+=+" + "'" + searchTerm + "'"; 
  }
  else {
    url = "https://ORGBASE.my.salesforce.com/services/data/v51.0/sobjects/"  + searchType + "/" + searchTerm;
  }

  Logger.log(url);
  try {
    var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + salesforceService.getAccessToken()
    }
    });
  } catch (error) {
    Logger.log(error)
    var response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + salesforceService.getAccessToken()
    }
    });
  }
  
  let json = JSON.parse(response);
  Logger.log(json);

  let results = [];
  if (searchType == "search") {
    for (let i = 0; i < json.searchRecords.length; i++) {
      let itemUrl = json.searchRecords[i].attributes.url;
      let response = UrlFetchApp.fetch(orgBase + itemUrl, {
        headers: {
        Authorization: 'Bearer ' + salesforceService.getAccessToken()
      }
    })
    results.push(JSON.parse(response));
    } 
  }
  else {
    return json;
  }
  return results;
}

      //0 [result.records[i].Id,
      //1 result.records[i].Institution__c,
      //2  result.records[i].Due_Date__c,
      //3   result.records[i].Submitted__c,
      //4    contactArray[selected].Completed_Common_App_Essay__c,
      //5     result.records[i].Supplemental_Essays_Completed__c,
      //6      result.records[i].Testing_Sent__c,
      //7       result.records[i].Transcripts_Sent__c,
      //8        result.records[i].LOR_Sent__c,
      //9         result.records[i].FAFSA_Sent__c,
      //10          result.records[i].CSS_Profile_Sent__c,
      //11           result.records[i].Portfolio_Sent__c,
      //12            result.records[i].Portfolio_Instructions__c,
      //13             result.records[i].Outcome__c,
      //14              result.records[i].Application_Type__c,
      //15               result.records[i].Institution__r.Name]

function pushToSalesforce(applicationTable, contact) {
  var salesforceService = getSalesforceService();
  Logger.log(contact);
  for (let i = 0; i < applicationTable.length; i++) {
    let payload = {};
    // payload.Id = applicationTable[i][0];
    payload.Student__c = contact.Id;
    payload.Institution__c = applicationTable[i][1];
    // *******************************************
    // EMPTY DATE BREAKS THIS
    // *******************************************
    payload.Due_Date__c = applicationTable[i][2];
    payload.Submitted__c = applicationTable[i][3];
    // payload.Completed_Common_App_Essay__c = applicationTable[i][4];
    payload.Supplemental_Essays_Completed__c = applicationTable[i][5];
    payload.Testing_Sent__c = applicationTable[i][6];
    payload.Transcripts_Sent__c = applicationTable[i][7];
    payload.LOR_Sent__c = applicationTable[i][8];
    payload.FAFSA_Sent__c = applicationTable[i][9];
    payload.CSS_Profile_Sent__c = applicationTable[i][10];
    payload.Portfolio_Sent__c = applicationTable[i][11];
    payload.Portfolio_Instructions__c = applicationTable[i][12];
    payload.Outcome__c = applicationTable[i][13];
    payload.Application_Type__c = applicationTable[i][14];

    let url = "https://ORGBASE.my.salesforce.com/services/data/v51.0/sobjects/Application__c/" + applicationTable[i][0];

    if (applicationTable[i][0] == "") {
      var response = UrlFetchApp.fetch(url, {
      'method' : 'post',
      'contentType': 'application/json',
      'payload' : JSON.stringify(payload),
      headers: {
        Authorization: 'Bearer ' + salesforceService.getAccessToken()},
      })
      response = JSON.parse(response);
      applicationTable[i][0] = response["id"];
    }
    else {
      var response = UrlFetchApp.fetch(url, {
      'method' : 'patch',
      'contentType': 'application/json',
      'payload' : JSON.stringify(payload),
      headers: {
        Authorization: 'Bearer ' + salesforceService.getAccessToken()},
      })
      // Not getting id -- coming in null on the front end
    }
    
  }
  return applicationTable;
}

function getSchoolName(table, row) {
  var salesforceService = getSalesforceService();
  for (let i = 0; i < table.length; i++) {
    let id = table[i][1];
    let url = "https://ORGBASE.my.salesforce.com/services/data/v51.0/query/?q=select+name+from+account+where+id+=+" + "'" + id + "'";
    var response = UrlFetchApp.fetch(url, {
      headers: {
        Authorization: 'Bearer ' + salesforceService.getAccessToken()}
      })
    let json = JSON.parse(response);
    table[i].push(json.records[0].Name)
  }
  return table, row;
}

function getSalesforceService() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('salesforce')
      // Find endpoints here -> https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_endpoints.htm&type=5
      .setAuthorizationBaseUrl('https://login.salesforce.com/services/oauth2/authorize')
      .setTokenUrl('https://login.salesforce.com/services/oauth2/token')

      // Set the client ID and secret
      .setClientId('CLIENT_ID')
      .setClientSecret('CLIENT_SECRET')

      // Set the name of the callback function in the script referenced
      // above that should be invoked to complete the OAuth flow.
      .setCallbackFunction('authCallback')

      // Set the property store where authorized tokens should be persisted.
      .setPropertyStore(PropertiesService.getUserProperties())

      // Set the scopes to request. 
      // Find scopes here -> https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_tokens_scopes.htm&type=5
      .setScope('api')

      // Sets the login hint, which will prevent the account chooser screen
      // from being shown to users logged in with multiple accounts.
      .setParam('login_hint', Session.getEffectiveUser().getEmail())

      // Requests offline access.
      .setParam('access_type', 'offline-access')

      // Consent prompt is required to ensure a refresh token is always
      // returned when requesting offline access.
      .setParam('prompt', 'consent')

      // Persists access token
      .setPropertyStore(PropertiesService.getUserProperties())

      .setCache(CacheService.getUserCache());
}

function showSidebar() {
  let salesforceService = getSalesforceService();
  if (salesforceService.hasAccess()) {
    let authorizationUrl = salesforceService.getAuthorizationUrl();
    Logger.log(authorizationUrl);
    return authorizationUrl;
  } else {
    return "https://script.google.com/a/macros/collegeliftoff.org/s/AKfycbyFgOolppmYIgTMzNzeJ1VKSzXGWl3D_-JydWIzYN4/dev";
  }
}

function authCallback(request) {
  let salesforceService = getSalesforceService();
  let isAuthorized = salesforceService.handleCallback(request);
  if (isAuthorized) {
    Logger.log("Success!");
    return HtmlService.createHtmlOutput('<p>Successfully authenticated. Please close this window.</p>');
  } else {
    Logger.log("Failure!");
    return HtmlService.createHtmlOutput('<p>Something went wrong. Please referesh and try again.</p>')
  }
}

// Allows separate html pages to be included
function include(filename){
   return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Initializes web app
function doGet() {
  return HtmlService.createTemplateFromFile('index').evaluate();
}
