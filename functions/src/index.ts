import * as admin from 'firebase-admin';
import * as uploadFile from './upload-file';
import * as getPathItems from './getPathItems';

admin.initializeApp();

module.exports = {
    ...uploadFile,
    ...getPathItems
}