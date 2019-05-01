import * as admin from 'firebase-admin';
import * as uploadFile from './upload-file';
import * as hierachygetter from './hierachy-getter';

admin.initializeApp();

module.exports = {
    ...uploadFile,
    ...hierachygetter
}