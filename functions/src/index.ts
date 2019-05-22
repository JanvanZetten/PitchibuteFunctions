import * as admin from 'firebase-admin';
import * as uploadFile from './upload-file';
import * as getPathItems from './getPathItems';
import * as addUserGroup from './add-user-group'
import * as testDownloadFile from './test-download-file';
import * as downloadFile from './download-file';
import * as logCreate from './log-create';
import * as renameItem from './renameItem'
import * as addItem from './add-item'
import * as deleteItem from './delete-item'

// Fetch the service account key JSON file contents
const serviceAccount = require("../pitchibute-5171e0a0103b.json");

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "pitchibute.appspot.com"
});

module.exports = {
    ...deleteItem,
    ...renameItem,
    ...uploadFile,
    ...getPathItems,
    ...addUserGroup,
    ...testDownloadFile,
    ...uploadFile,
    ...downloadFile,
    ...logCreate,
    ...addItem
};
