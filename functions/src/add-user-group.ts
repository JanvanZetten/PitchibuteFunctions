import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';



exports.addUserToGroup  = functions.https.onRequest(async (req, res) => {

    const data = req.body;
    const collection = data.collection;
    const doc = data.doc;
    const users = data.users;
    // Check if collection, doc are not empty and that user list is defined.
    if(collection && doc && users)
    {
        // Adding the newly added user.
        users.push(data.user);
        try {
            admin.firestore().collection(collection).doc(doc).set({
                    users: users
                },
                {merge: true}
            ).catch(error => {
                console.log(error);
                throw error;
            });
            res.send('User was successfully added');
        }
        catch(error) {
            res.send('Something unexpected happened. Error.')
        }
    }
    else
    {
        res.send('Missing parameters.')
    }
});
