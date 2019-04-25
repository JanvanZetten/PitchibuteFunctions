import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

exports.TestFunction = functions.https.onRequest((request, response) => {
    response.send('This is a test');
});

exports.DownloadTest = functions.https.onRequest((req, res) => {

    const bucketvar = admin.storage().bucket('gs://pitchibute.appspot.com/test');
    const myFile = bucketvar.file('/pkaFile.pka').createWriteStream()
        .on('err', (err) => {
            throw err;
        });
    console.log(myFile);

    res.contentType('application/octet-stream');
    res.pipe(myFile);

    /*myFile.getSignedUrl({action: 'read', expires: '03-09-2491'}).then(urls => {
        res.send(urls[0]);
    }).catch(err => {console.log(err)});*/
});
