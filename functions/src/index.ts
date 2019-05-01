import * as admin from 'firebase-admin';
import * as uploadFile from './upload-file';
import * as addUserGroup from './add-user-group'
import * as testDownloadFile from './test-download-file';

// Fetch the service account key JSON file contents
const serviceAccount = require("../pitchibute-5171e0a0103b.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "pitchibute.appspot.com"
});

module.exports = {
    ...uploadFile,
    ...addUserGroup,
    ...testDownloadFile,
    ...uploadFile
};
