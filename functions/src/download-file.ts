import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as corsModule from 'cors';
import { Authorization } from './authorization';
import { CustomError } from './custom-error';
import { Helper } from './helpers/helper';

const cors = corsModule({
    origin: true, exposedHeaders: ['Content-Type', 'Content-Disposition', 'Content-Length'] });

/**
 * Download File. 
 * Used to download file.
 * Body: 
 * {
 *   "path": "<Full storage path>"
 * }
 * Route: /downloadfile
 */
exports.downloadfile =
    functions
    .https.onRequest((request, response) => {
        cors(request, response, async () => {
            const auth = new Authorization();
            const helper = new Helper();
            let decodedUserUid = '';
            try {
                // Check if the request is carries an Authorization header.
                const tokenBearer = auth.validateFirebaseIdToken(request);
                
                await auth.verifyToken(tokenBearer).then(token => {
                    decodedUserUid = token.uid;
                }).catch(() => {
                    console.error('498: Invalid token: ' + tokenBearer);
                    throw new CustomError('Invalid token', 498);
                });

                if (request.method === 'POST') {
                    // Read Data from Request
                    const data = request.body;

                    console.log('User UID: ' + decodedUserUid + ', Data found in body: ' + JSON.stringify(data));
                    if (data.path) {
                        // Get file path from body.
                        const filePath = data.path;
                        let splitMetadataPath = new Array<string>();

                        // Bucket to use.
                        const bucket = admin.storage().bucket();
                        const splitFilePath = filePath.split('/').filter(Boolean);
                        const fileId = splitFilePath[splitFilePath.length - 1];
                        // Get metadata.
                        await bucket
                            .file(filePath)
                            .getMetadata().then(async dataArr => {
                                const fileMetadata = dataArr[0];
                                console.log('User UID: ' + decodedUserUid + ', File Metadata: ' + JSON.stringify(fileMetadata));
                                
                                // Get users with permission from root item.
                                if (fileMetadata && fileMetadata.metadata && fileMetadata.metadata.path) {
                                    splitMetadataPath = fileMetadata.metadata.path.split('/').filter(Boolean);

                                    // Calculate root item path.
                                    let rootItemPath = '';
                                    if (splitMetadataPath.length > 0) {
                                        rootItemPath = splitMetadataPath[0];
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
                                                            console.error('401: Unathorized, User UID: ' + decodedUserUid);
                                                            throw new CustomError('You are not authorized to do this', 401);
                                                        }
                                                    } else {
                                                        console.error('401: Unathorized, User UID: ' + decodedUserUid);
                                                        throw new CustomError('You are not authorized to do this', 401);
                                                    }
                                                } else {
                                                    console.error('401: Unathorized, User UID: ' + decodedUserUid);
                                                    throw new CustomError('You are not authorized to do this', 401);
                                                }
                                            })
                                            .catch(err => {
                                                console.error(err + ', User UID: ' + decodedUserUid);
                                                throw new CustomError('You are not authorized to do this', 401);
                                            });
                                    }
                                    else {
                                        console.error('401: Unathorized, User UID: ' + decodedUserUid);
                                        throw new CustomError('You are not authorized to do this', 401);
                                    }
                                } else {
                                    console.error('401: Unathorized, User UID: ' + decodedUserUid);
                                    throw new CustomError('You are not authorized to do this', 401);
                                }

                                // Calculate document path.
                                let docPath = '';

                                splitMetadataPath.forEach(docId => {
                                    docPath += 'items/' + docId + '/';
                                });

                                docPath += 'items/';

                                let base64FileName = '';
                                // Get file document.
                                await admin.firestore().collection(docPath).doc(fileId).get()
                                    .then(doc => {
                                        const docData = doc.data();
                                        if (docData && docData.name) {
                                            // Convert name to base64 because the HTTP Headers does not support special characters as (�, � & �)
                                            base64FileName = Buffer.from(docData.name).toString('base64');
                                        } else {
                                            console.error('Document name not found, User UID: ' + decodedUserUid);
                                            throw new CustomError('Document name not found', 404);
                                        }
                                    })
                                    .catch(err => {
                                        console.error(err + ', User UID: ' + decodedUserUid);
                                        throw new CustomError('Document not found', 404);
                                    });

                                // The content type and original file name is used for the HTTP Request Header.
                                // Double quotes is used in the originalName because of spaces. (Now we changed it to base64, where should not be any spaces, though)
                                response.writeHead(200, {
                                    'Content-Type': fileMetadata.contentType,
                                    'Content-Disposition': 'attachment; filename="' + base64FileName + '"'
                                });
                            }).catch(err => {
                                console.error(err + ', User UID: ' + decodedUserUid);
                                throw err;
                            });
                        
                        // Create Read Stream from file and piped to the response.
                        await bucket.file(filePath).createReadStream()
                            .on('complete', () => {
                                console.log('Finish event emitted, User UID: ' + decodedUserUid);

                                response.end();
                            })
                            .on('error', err => {
                                console.error(err + ', User UID: ' + decodedUserUid);
                                throw err;
                            })
                            .pipe(response)
                            .on('complete', () => {
                                console.log('Finish event emitted, User UID: ' + decodedUserUid);

                                response.end();
                            })
                            .on('error', err => {
                                console.error(err + ', User UID: ' + decodedUserUid);
                                throw err;
                            });
                    } else { // In case the path is not set.
                        console.log('Path: ' + data.path + ', User UID: ' + decodedUserUid);
                        throw new CustomError('Not supported path', 404);
                    }
                } else { // In case the request is not a post.
                    console.log('Method: ' + request.method + ', User UID: ' + decodedUserUid);
                    throw new CustomError('Request not supported, only POST', 405);
                }
            } catch (error) {
                console.error(error + ', User UID: ' + decodedUserUid);
                if (error instanceof CustomError) {
                    response.status(error.errorStatus).send(error.message);
                } else {
                    response.status(500).send('Something unexpected happened. Contact the administrator team');
                }
            }
        });
    });
