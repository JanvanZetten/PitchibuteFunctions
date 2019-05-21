import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Helper } from './helpers/helper';

// should be the same as web apps item type.
enum type {
    group, event, folder, file, link
}

/*
 * When files are uploaded to firebase storage, the metadata is added to a document in the files collection.
 */
exports.uploadfile =
    functions.storage.object().onFinalize(async (object, context) => {
        const helper = new Helper();
        console.log('Object: ' + JSON.stringify(object));

        let splitPath = new Array<string>();
        let shouldDestroyFile = false;
        // Checks if Authentication is set. If not deletes the file.
        // Checks if user is allowed to add file to group.
        if (object && object.metadata && object.metadata.token && object.metadata.path) {
            let decodedUserUid = '';

            await admin.auth().verifyIdToken(object.metadata.token).then(token => {
                decodedUserUid = token.uid;
            }).catch(() => {
                console.error('Invalid token: ' + decodedUserUid);
                shouldDestroyFile = true;
                });

            if (!shouldDestroyFile) {
                console.log('Decoded User Id: ' + decodedUserUid);

                splitPath = object.metadata.path.split('/').filter(Boolean);

                // Calculate root item path.
                let rootItemPath = '';
                if (splitPath.length > 0) {
                    rootItemPath = splitPath[0];
                }

                if (rootItemPath !== '') {
                    console.log('Root item path: ' + rootItemPath);
                    await helper.getDocument('items', rootItemPath)
                        .then(doc => {
                            if (doc && doc.exists && doc.data()) {
                                const docData = doc.data();
                                if (docData && docData.users) {
                                    console.log('Document users: ', docData.users);
                                    if (docData.users.indexOf(decodedUserUid) < 0) {
                                        console.error('Unauthorized, User UID: ' + decodedUserUid);
                                        shouldDestroyFile = true;
                                    }
                                } else {
                                    console.error('Unauthorized, User UID: ' + decodedUserUid);
                                    shouldDestroyFile = true;
                                }
                            } else {
                                console.error('Unauthorized, User UID: ' + decodedUserUid);
                                shouldDestroyFile = true;
                            }
                        })
                        .catch(err => {
                            console.error(err + ', User UID: ' + decodedUserUid);
                            shouldDestroyFile = true;
                        });
                } else {
                    console.error('Unauthorized, User UID: ' + decodedUserUid);
                    shouldDestroyFile = true;
                }
            }
        } else {
            console.error('Missing data: ' + JSON.stringify(object));
            shouldDestroyFile = true;
        }

        console.log('Should destroy file: ' + shouldDestroyFile);
        if (shouldDestroyFile) {
            return destroyFile(object);
        }

        return new Promise((resolve, reject) => {
            if (object && object.name && object.metadata) {

                // Create meta data.
                const fileMeta = {
                    lastModified: object.updated,
                    name: object.metadata.originalName,
                    type: type.file,
                    size: object.size
                };

                const ITEMS = 'items'

                let collection = admin.firestore().collection(ITEMS)

                splitPath.forEach(docId => {
                    if (docId !== '') {
                        collection = collection.doc(docId).collection(ITEMS)
                    }
                })

                // Get the id of the generated file to save the document as.
                const nameForDoc = object.name.split('/')[1];

                // Save the document to firestore in files collection.
                collection
                    .doc(nameForDoc)
                    .set(fileMeta)
                    .then(value => resolve(value))
                    .catch(err => reject(err))
            } else {
                reject('Error happened, not enough metadata or file data');
            }
        });
    });

async function destroyFile(object: functions.storage.ObjectMetadata) {
    if (object.name) {
        await admin.storage().bucket().file(object.name).delete().then(() => {
            console.log('Successfully deleted unauthorized file upload: ' + object.name);
        }).catch(err => {
            console.error('Failed deleting unauthorized file upload: ' + object.name);
        });
    } else {
        console.error('Failed deleting unauthorized file upload, missing name: ' + JSON.stringify(object));
    }
    return new Promise((resolve, reject) => {
        reject('Unauthorized action succeeded');
    });
}