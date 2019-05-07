import * as functions from 'firebase-functions';
//const https = require('https');

// should be the same as web apps item type.
enum type {
    group, event, folder, file, link
}

// What to write when type is not set.
const noType = 'invalid';

// Event identifier message.
const newDoc = 'New document';
const updatedDoc = 'Updated document';
const deletedDoc = 'Deleted document';

// Document states.
const docBefore = 'OLD';
const docAfter = 'NEW';

/**
 * Log upload file event.
 */
exports.logOnFileUpload = functions.storage.object().onFinalize((object, con) => {
    return new Promise((resolve, reject) => {
        const errorMessage = 'Tried to upload an invalid file.';
        if (object && object.name && object.metadata) {
            console.log('Filename: ' + object.metadata.originalName + ', size: ' + object.size);
        } else {
            console.error(errorMessage);
        }

		/**
		 * Example for humio logging.
		 */
		/*
        const errorPreMessage = 'OnFileUpload: ';

        const data = JSON.stringify([
            {
                messages: [errorPreMessage + errorMessage]
            }
        ]);

        const options = {
            hostname: 'cloud.humio.com',
            port: 443,
            path: '/api/v1/ingest/humio-unstructured',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            },
            auth: 'Bearer <Ingest Token>',
        }

        https.request(options);
		*/

        resolve(object);
    });
});

/**
 * Log new group document event.
 */
exports.logOnItemDocumentCreate = functions.firestore.document('groups/{groupId}')
    .onCreate((snapshot, context) => {
        const snapshotNew = snapshot.data();
        if (snapshotNew && snapshotNew.type) {
            console.log(newDoc, type[snapshotNew.type], snapshot.id, snapshotNew);
        } else {
            console.error(newDoc, noType, snapshot.id, snapshotNew);
        }
        return new Promise((resolve, reject) => {
            resolve(snapshot);
        });
    });

/**
 * Log update group document event.
 */
exports.logOnItemDocumentUpdate = functions.firestore.document('groups/{groupId}')
    .onUpdate((snapshot, context) => {
        const snapshotBefore = snapshot.before.data();
        const snapshotAfter = snapshot.after.data();
        if (snapshotBefore && snapshotBefore.type) {
            if (snapshotAfter && snapshotAfter.type) {
                console.log(updatedDoc, docBefore, type[snapshotBefore.type], snapshot.before.id, snapshotBefore, docAfter, type[snapshotAfter.type], snapshot.after.id, snapshotAfter);
            } else {
                console.error(updatedDoc, docBefore, type[snapshotBefore.type], snapshot.before.id, snapshotBefore, ',\n', docAfter, noType, snapshot.after.id, snapshotAfter);
            }
        } else {
            console.error(updatedDoc, docBefore, noType, snapshot.before.id, snapshotBefore, docAfter, noType, snapshot.after.id, snapshotAfter);
        }
        return new Promise((resolve, reject) => {
            resolve(snapshot);
        });
    });

/**
 * Log deleted group document event.
 */
exports.logOnItemDocumentDelete = functions.firestore.document('groups/{groupId}')
    .onDelete((snapshot, context) => {
        const snapshotDeleted = snapshot.data();
        if (snapshotDeleted && snapshotDeleted.type) {
            console.log(deletedDoc, type[snapshotDeleted.type], snapshot.id, snapshotDeleted);
        } else {
            console.error(deletedDoc, noType, snapshot.id, snapshotDeleted);
        }
        return new Promise((resolve, reject) => {
            resolve(snapshot);
        });
    });