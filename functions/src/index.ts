import * as admin from 'firebase-admin';
import * as uploadFile from './upload-file';

admin.initializeApp();

module.exports = {
    ...uploadFile
}