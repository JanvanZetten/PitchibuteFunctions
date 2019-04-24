import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

enum type {
    file
}

/*
 * When files are uploaded to firebase storage, the metadata is added to a document in the files collection.
 */
exports.uploadfile =
    functions.storage.object().onFinalize((object) => {
        return new Promise((resolve, reject) => {
            if (object && object.name && object.metadata) {

                // Create meta data.
                const fileMeta = {
                    lastModified: object.updated,
                    name: object.metadata.originalName,
                    type: type.file,
                    size: object.size
                };

                // Get the id of the generated file to save the document as.
                const nameForDoc = object.name.split('/')[1];

                // Save the document to firestore in files collection.
                admin.firestore().collection('files')
                    .doc(nameForDoc)
                    .set(fileMeta)
                    .then(value => resolve(value))
                    .catch(err => reject(err))
            } else {
                reject('Error happened, not enough metadata or file data');
            }
        });
    });