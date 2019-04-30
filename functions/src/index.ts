import * as admin from 'firebase-admin';
import * as uploadFile from './upload-file';
import * as addUserGroup from './add-user-group'

admin.initializeApp();

module.exports = {
    ...uploadFile,
    ...addUserGroup
};
