import * as functions from 'firebase-functions';
//import * as admin from 'firebase-admin';
import {CustomError} from "./custom-error";
import {Authorization} from "./authorization";
import {Helper} from "./helpers/helper";
import * as corsModule from 'cors';

const cors = corsModule({
    origin: true, exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length']
});


exports.addUserToGroup = functions.https.onRequest((req, res) => {

    cors(req, res, async () => {
        const helper = new Helper();
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
                const tokenBearer = auth.validateFirebaseIdToken(req);

                await auth.verifyToken(tokenBearer).then(token => {
                    decodedUserUid = token.uid;
                }).catch(() => {
                    throw new CustomError('You are not authorized to do this', 401);
                });

                await helper.getUserByEmail(email).then(userData => {
                    userId = userData.uid;
                }).catch(error => {
                    console.log(error.message);
                    throw new CustomError('User with the email ' + email + ' was not found.', 404);

                });

                await helper.getDocument(collection, doc).then(snapShot => {
                    // @ts-ignore
                    if (snapShot.data().type !== 0) {
                        throw new CustomError('You tried adding user to a non-group', 403)
                    }
                    // @ts-ignore
                    users = snapShot.data().users;
                }).catch(error => {
                    console.log(error.message);
                    if (error instanceof CustomError) {
                        throw error;
                    }
                    throw new CustomError('Group not found.', 404);
                });

                // Checking if the one adding a user is himself apart of group.
                helper.addUserToGroupIfAuthorized(users, userId, decodedUserUid);

                helper.addNewUser(collection, doc, users);
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
    })
});
