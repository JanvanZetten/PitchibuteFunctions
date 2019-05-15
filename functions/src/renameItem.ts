import * as functions from 'firebase-functions';
//import * as admin from 'firebase-admin';
import {Authorization} from "./authorization";
import {Helper} from "./helpers/helper";
import {CustomError} from "./custom-error";
import * as corsModule from 'cors';

const cors = corsModule({
    origin: true, exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length']
});
exports.renameItem = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const helper = new Helper();
        const auth = new Authorization();
        const reqData = req.body;

        const newName = reqData.name;
        const doc = reqData.doc;

        const collection = reqData.collection;

        let userRequestUid: string;

        if (newName && collection && doc) {
            try {
                const tokenBearer = auth.validateFirebaseIdToken(req);
                const collectionArray = collection.split('/');

                await auth.verifyToken(tokenBearer).then(token => {
                    userRequestUid = token.uid;
                }).catch(error => {
                    throw new CustomError('You are not authorized', 403);
                });
                await helper.getDocument(collectionArray[1], collectionArray[2])
                    .then(snapShot => {
                        const data = snapShot.data();
                        // @ts-ignore
                        if (!helper.apartOfGroup(data.users, userRequestUid)) {
                            throw new CustomError('You are not authorized, not part of the group', 403);
                        }
                    }).catch(error => {
                        throw error
                    });

                await helper.getDocument(collection, doc).then(snapShot => {
                    const data = snapShot.data();
                    // @ts-ignore
                    helper.nameChecker(data.name, newName);
                }).catch(error => {
                    throw error
                });

                helper.renameItem(collection, doc, newName);
                res.send('Changed name of item')

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
