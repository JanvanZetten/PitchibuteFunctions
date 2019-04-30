import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';



exports.addUserToGroup  = functions.https.onRequest((req, res) => {

    const data = req.body;
    const collection = data.collection;
    const doc = data.doc;
    const users = [];


    admin.firestore().collection(collection).doc(doc).get().then( async documentData => {
        users = await documentData.data()
    }).catch(error => {
        console.log(error);
    });
    users.push(data.user);

    admin.firestore().collection(collection).doc(doc).set({users: users
        },
        {merge: true}
    ).catch(error => {
        console.log(error)
    });

    res.send('hello');

});
