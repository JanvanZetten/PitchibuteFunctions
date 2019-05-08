import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {CustomError} from "./CustomError";
import {Authorization as auth} from "./authorization";

function addNewUser(collection: string, doc: string, users: []) {
    // Merging data.(adding new user)
    admin.firestore().collection(collection).doc(doc).set({
            users: users
        },
        {merge: true}
    ).catch(error => {
        console.log(error);
        throw new CustomError('Could not add user to the group, contact administrator team.');
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

    // Checking if user has a token for auth.
    auth.validateFirebaseIdToken(req, res);

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
            let tokenForDecode = req.get('Authorization');
            // @ts-ignore
            tokenForDecode = tokenForDecode.split('Bearer ')[1];
            // Decoding the token in order to get uid.
            // @ts-ignore
            await auth.verifyToken(tokenForDecode)
            // @ts-ignore
                .then(token => {
                        decodedUserUid = token.uid;
                }).catch(error => {
                    throw error;
                });

            await getUserByEmail(email).then(userData => {
                userId = userData.uid;
            }).catch(error => {
                console.log(error.message);
                throw new CustomError('User with the email ' + email + ' was not found.');
            });

            await getDocument(doc).then(snapShot => {
                // @ts-ignore
                users = snapShot.data().users;
                if (!users) {
                    throw new CustomError('Group was not found')
                }
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
                res.send('Something unexpected happened. Contact the administrator team' + error.message)
            }
        }
    } else {
        res.send('Missing parameters.')
    }
});
