import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

exports.addUserToGroup = functions.https.onRequest(async (req, res) => {


    const data = req.body;
    const email = data.email;
    const collection = data.collection;
    const doc = data.doc;
    const users = data.users;
    let userId = '';
    // Check if collection, doc are not empty and that user list is defined.
    if (collection && doc && users && email) {
        try {
            // Retrieving the data about the user, to get the user-id.
            // Await so we wont go further with code until we get the data.
             await admin.auth().getUserByEmail(email).then( userData => {
                userId = userData.uid;
            }).catch(error => {
                console.log(error.message);
                throw error;
            });

            users.push(userId);

            // Merging data.(adding new user)
            admin.firestore().collection(collection).doc(doc).set({
                    users: users
                },
                {merge: true}
            ).catch(error => {
                console.log(error);
                throw error;
            });
            res.send('User was successfully added');
        } catch (error) {
            res.send('Something unexpected happened. Error.')
        }
    } else {
        res.send('Missing parameters.')
    }
});
