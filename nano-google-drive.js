/* By Morgan McGuire @CasualEffects http://casual-effects.com GPL 3.0 License*/

// Google Drive + OAuth 2.0 API Wrapper


/** Invokes callback with an object containing {photoLink: displayName: emailAddress: }
*/
function googleDriveGetUserInfo(callback) {
    gapi.client.drive.about.get({fields:'user'}).then(function(x) {
        callback(JSON.parse(x.body).user);
    });
}

/**
   Retrieve a list of File resources that have key=value and have NOT been deleted.

 Based on https://developers.google.com/drive/v2/reference/files/list
 */
function googleDriveRetrieveAllFiles(key, value, callback) {
    gapi.client.drive.files.list({
        // The spaces should be 'drive' for the whole drive or 'appDataFolder' to just
        // see in this app's hidden, private space
        spaces: 'drive',
        //q:"mimeType = 'application/vnd.google-apps.folder'",
        //q:'name="nano ᴊᴀᴍᴍᴇʀ"',
        q: "trashed=false and properties has { key='" + key + "' and value='" + value + "' }",
        fields: 'nextPageToken, files(id, name, appProperties)',
        pageSize: 100
    }).then(function(data) {
        callback(data.result.files);
   });
}


/** Invokes the callback with (error, file). file.id is the ID of the created file */
function googleDriveCreateFolder(name, callback) {
    const boundary = '-------X314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    var metadata = {
        'name': name,
        'mimeType': 'application/vnd.google-apps.folder'
    };

    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});

    if (! callback) {
        // Create a dummy callback
        callback = function(file) { console.log(file)  };
    }
    
    request.execute(callback);

}


/**
   Invokes the callback with (fileId, contents, data). The contents are null if
   there was an error. Data is just passed on to the callback.

   You can get the fileId from googleDriveRetrieveAllFiles.
   https://developers.google.com/drive/v3/reference/files/get
 */
function googleDriveGetTextFile(fileId, callback, data) {
    var request = gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    });
    
    request.execute(function () {
        var accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload = function() {
            callback(fileId, xhr.responseText, data);
        };
        
        xhr.onerror = function(x) {
            callback(fileId, null, data);
        };
            
        xhr.send();
    });
}


/** https://developers.google.com/drive/v2/reference/files/trash */
/*
function googleDriveDeleteFile(fileId, callback) {
    var request = gapi.client.drive.files.trash({
        'fileId': fileId
    });
    request.execute(function(resp) { callback(); });
}*/


/** Save a text file to Google Drive. If fileId is specified, then the existing file
    is renamed and overwritten, otherwise a new file is created.

    Based on:

    - https://developers.google.com/drive/v3/web/multipart-upload
    - https://developers.google.com/drive/v3/reference/files/update
    - https://stackoverflow.com/questions/40600725/google-drive-api-v3-javascript-update-file-contents

    Set trash = true to move the file to trash.
  */
function googleDriveSaveTextFile(filename, key, value, appProperties, fileContents, callback, fileId, trash) {
    const boundary = '-------X314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    console.log(fileContents);
    if (typeof fileContents !== 'string') {
        throw 'File contents was not a string: ' + fileContents;
    }

    if (fileContents.indexOf(boundary) !== -1) {
        // The source is trying to hack the transfer protocol
        throw "File contains boundary!";
    }

    var contentType = 'text/plain';
    var metadata = {
        name:      filename,
        mimeType:  contentType,
        fields:    'id',
        appProperties: appProperties,
        properties: {}
    };
    metadata.properties[key] = value;

    if (trash) {
        // Setting it to false seems to also act as true,
        // so only set trashed when we want that
        metadata.trashed = true;
    }
    
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        '\r\n' +
        fileContents +
        close_delim;

    var request = gapi.client.request({
        path: '/upload/drive/v3/files' + (fileId ? '/' + fileId : ''),
        method: (fileId ? 'PATCH' : 'POST'),
        params: {uploadType: 'multipart'},
        headers: {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        body: multipartRequestBody});

    if (! callback) {
        // Create a dummy callback
        callback = function(file) {  };
    }
    
    request.execute(callback);
}



// The following are based on:
// https://github.com/google/google-api-javascript-client/blob/master/samples/authSample.html

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        onSignIn();        
    } else {
        onSignOut();
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}


function handleClientLoad() {
    // Load the API client and auth2 library
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.load('client', function() {
        // Initialize the JavaScript client library.
        gapi.client.init({
            'apiKey': 'AIzaSyAlRiTht5T9CLtYAQhFnZGdgtqmSvD_Js0',
            'clientId': '442588265355-cv3vd67iv8c79ckfsm3m8vbgfl6pr104.apps.googleusercontent.com',
            'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],

            // Whole drive, all apps: (needed for sharing between users?)
            // This requires Google to approve the app.
            //'scope': 'https://www.googleapis.com/auth/drive',

            // Whole drive, app only:
            'scope': 'https://www.googleapis.com/auth/drive.file',

            // Hidden app folder:
            //'scope': 'https://www.googleapis.com/auth/drive.appfolder'
        }).then(function () {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    });
}
