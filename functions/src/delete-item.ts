import * as functions from 'firebase-functions';
import {Authorization} from "./authorization";
import {Helper} from "./helpers/helper";
import {CustomError} from "./custom-error";
import * as corsModule from 'cors';

const cors = corsModule({
    origin: true, exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length']
});
exports.deleteItem = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
        const helper = new Helper();
        const auth = new Authorization();
        const reqData = req.body;
        let userRequestUid: string;
        const doc = reqData.doc;
        const collection = reqData.collection;
        if (doc && collection) {
            try {
                const tokenBearer = auth.validateFirebaseIdToken(req);
                const collectionArray = collection.split('/');

                await auth.verifyToken(tokenBearer).then(token => {
                    userRequestUid = token.uid;
                }).catch(error => {
                    throw new CustomError('You are not authorized', 403);
                });

                await helper.getDocument(collectionArray[0], collectionArray.length > 0 && collectionArray[1] !== '' ? collectionArray[1] : doc)
                    .then(snapShot => {
                        const data = snapShot.data();
                        // @ts-ignore
                        if (!helper.apartOfGroup(data.users, userRequestUid)) {
                            throw new CustomError('You are not authorized, not part of the group', 403);
                        }
                        if (collectionArray.length > 0 && collectionArray[1] === '') {
                            throw new CustomError('You cannot delete a group', 400);
                        }
                    }).catch(error => {
                        throw error
                    });

                if (collectionArray.length > 0 && collectionArray[1] !== '') {
                    await helper.getDocument(collection, doc).then(snapShot => {
                        const data = snapShot.data();
                        // @ts-ignore
                        if (data.type === 0) {
                            throw new CustomError('You cannot delete a group', 400);
                        }
                    }).catch(error => {
                        throw error
                    });
                }
                helper.delete(collection, doc);
                res.status(200).send('You have successfully deleted item')

            } catch
                (error) {
                console.error(error);
                if (error instanceof CustomError) {
                    res.status(error.errorStatus).send(error.message);
                } else {
                    res.status(400).send('Something unexpected happened. Contact the administrator team')
                }
            }
        } else {
            throw new CustomError('Missing parameters', 400);
        }
    });
});
