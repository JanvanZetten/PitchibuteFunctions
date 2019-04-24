import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

exports.TestFunction = functions.https.onRequest((request, response) => {
    response.send('This is a test');
});

exports.DownloadTest = functions.https.onRequest((req, res) => {
   return admin.firestore().collection('test').doc('Project Charter Template.pdf')

});

