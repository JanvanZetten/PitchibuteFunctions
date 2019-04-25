import * as admin from 'firebase-admin';
import * as fileDownload from './file-download';

const path = require("path");
const serviceAccount = path.resolve(__dirname, 'serviceaccount.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pitchibute.firebaseio.com",
    storageBucket: "gs://pitchibute.appspot.com.appspot.com"
});

module.exports = {
    ...fileDownload
};



// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
