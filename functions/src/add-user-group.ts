import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {CustomError} from "./CustomError";
import {Authorization} from "./authorization";

function addNewUser(collection: string, doc: string, users: string[]) {
    // Merging data.(adding new user)
    admin.firestore().collection(collection).doc(doc).set({
            users: users
        },
        {merge: true}
    ).catch(error => {
        console.log(error);
        throw new CustomError('Could not add user to the group, contact administrator team.',
            400);
    });
}

function apartOfGroup(users: string [], userId: string, decodedUserUid: string) {
    if (users.indexOf(decodedUserUid) !== -1) {
        if (users.indexOf(userId) === -1) {
            users.push(userId);
        } else {
            throw new CustomError('User is already in group', 400);
        }
    } else {
        throw new CustomError('You are not authorized to do that.', 403);
    }
}

function getUserByEmail(email: string) {

    // Retrieving the data about the user, to get the user-id.
    // Await so we wont go further with code until we get the data.
    return admin.auth().getUserByEmail(email);
}

function getDocument(collection:string, doc: string) {
    return admin.firestore().collection(collection).doc(doc).get();
}

exports.addUserToGroup = functions.https.onRequest(async (req, res) => {

    const auth = new Authorization();
    const data = req.body;
    const email = data.email;
    const collection = data.collection;
    const doc = data.doc;
    let users: string[] = [];
    let userId = '';
    let decodedUserUid = '';

    // Check if collection, doc and email are not empty.
    if (collection && doc && email) {
        try {
            // Checking if user has a token for auth. And verification''
            auth.validateFirebaseIdToken(req, res);
            const tokenBearer = req.get('Authorization');

            // @ts-ignore
            await auth.verifyToken(tokenBearer).then(token => {
                decodedUserUid = token.uid;
            }).catch(() => {
                throw new CustomError('You are not authorized to do this', 401);
            });

            await getUserByEmail(email).then(userData => {
                userId = userData.uid;
            }).catch(error => {
                console.log(error.message);
                throw new CustomError('User with the email ' + email + ' was not found.', 404);

            });

            await getDocument(collection, doc).then(snapShot => {
                // @ts-ignore
                if(snapShot.data().type !== 0){
                    throw new CustomError('You tried adding user to a non-group', 403)
                }
                // @ts-ignore
                users = snapShot.data().users;
            }).catch(error => {
                console.log(error.message);
                if(error instanceof CustomError){
                    throw error;
                }
                throw new CustomError('Group not found.', 404);
            });

            // Checking if the one adding a user is himself apart of group.
            apartOfGroup(users, userId, decodedUserUid);

            addNewUser(collection, doc, users);
            res.status(200).send('User was successfully added');
        } catch (error) {
            if (error instanceof CustomError) {
                res.status(error.errorStatus).send(error.message);
            } else {
                res.send('Something unexpected happened. Contact the administrator team')
            }
        }
    } else {
        res.send('Missing parameters.')
    }
});
