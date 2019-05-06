import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {CustomError} from "./CustomError";

function addNewUser(collection: string, doc: string, users: []) {
    // Merging data.(adding new user)
    admin.firestore().collection(collection).doc(doc).set({
            users: users
        },
        {merge: true}
    ).catch(error => {
        console.log(error);
        throw error;
    });
}

function apartOfGroup(users: [], userId: string, decodedUserUid: string) {
    // @ts-ignore
    if (users.indexOf(decodedUserUid) !== -1) {
        // @ts-ignore
        users.push(userId);
    } else {
        throw new CustomError('You are not authorized to do that.');
    }
}

function getUserByEmail(email: string) {

    // Retrieving the data about the user, to get the user-id.
    // Await so we wont go further with code until we get the data.
    return admin.auth().getUserByEmail(email);
}

function getDocument(doc: string) {
    return admin.firestore().collection("groups").doc(doc).get();
}

exports.addUserToGroup = functions.https.onRequest(async (req, res) => {


    const data = req.body;
    const email = data.email;
    const collection = data.collection;
    const doc = data.doc;
    // @ts-ignore
    let users: [] = [];
    let userId = '';
    // @ts-ignore
    let decodedUserUid = '';

    // Check if collection, doc and email are not empty.
    if (collection && doc && email) {
        try {
            // Decoding the token in order to get uid.
            // @ts-ignore
            await admin.auth().verifyIdToken(req.get('Authorization'))
            // @ts-ignore
                .then(token => {
                    decodedUserUid = token.uid;
                });

            await getUserByEmail(email).then(userData => {
                userId = userData.uid;
            }).catch(error => {
                console.log(error.message);
                throw error;
            });

            await getDocument(doc).then(snapShot => {
                // @ts-ignore
                users = snapShot.data().users;
            }).catch(error => {
                console.log(error.message);
                throw error;
            });

            // Checking if the one adding a user is himself apart of group.
            apartOfGroup(users, userId, decodedUserUid);

            addNewUser(collection, doc, users);
            res.send('User was successfully added');
        } catch (error) {
            if (error instanceof CustomError) {
                res.send(error.message);
            } else {
                res.send('Something unexpected happened. Contact the administrator team')
            }
        }
    } else {
        res.send('Missing parameters.')
    }
});
