import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as corsModule from 'cors';
import { Authorization } from './authorization';
import { CustomError } from './custom-error';

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
            let decodedUserUid = '';
            try {
                console.log('before validation');

                // Check if the request is carries an Authorization header.
                const tokenBearer = auth.validateFirebaseIdToken(request);
                console.log('after validation: ' + tokenBearer);
                
                await auth.verifyToken(tokenBearer).then(token => {
                    decodedUserUid = token.uid;
                }).catch(() => {
                    console.error('498: Invalid token');
                    throw new CustomError('Invalid token', 498);
                });
                console.log('Decoded User Id: ' + decodedUserUid);

                if (request.method === 'POST') {
                    // Read Data from Request
                    const data = request.body;

                    console.log('Data found in body: ' + data);
                    if (data.path) {
                        // Get file path from body.
                        const filePath = data.path;
                        console.log('Filepath: ' + filePath);

                        // Bucket to use.
                        const bucket = admin.storage().bucket();

                        // Get metadata.
                        await bucket
                            .file(filePath)
                            .getMetadata().then(async dataArr => {
                                const filemetadata = dataArr[0];
                                console.log('UID: ' + decodedUserUid + ', contentType: ' + filemetadata.contentType + ', originalName: ' + filemetadata.metadata.originalName);

                                // Convert original file name to base64 because the HTTP Headers does not support special characters as (�, � & �)
                                const base64FileName = Buffer.from(filemetadata.metadata.originalName).toString('base64');
                                console.log('base64FileName: ' + base64FileName);


                                // The content type and original file name is used for the HTTP Request Header.
                                // Double quotes is used in the originalName because of spaces.
                                response.writeHead(200, {
                                    'Content-Type': filemetadata.contentType,
                                    'Content-Disposition': 'attachment; filename="' + base64FileName + '"'
                                });


                                console.log('Before new section');
                                console.log('Filemetadata metadata path: ' + filemetadata.metadata.path);
                                // Get users with permission from root item.
                                if (filemetadata && filemetadata.metadata && filemetadata.metadata.path) {
                                    console.log('Found: ' + filemetadata.metadata.path);

                                    const splitPath = filemetadata.metadata.path.split('/')
                                    console.log('Split path: ' + splitPath);

                                    let rootItemPath = '';
                                    if (splitPath.length > 0) {
                                        if (splitPath[0].length > 0) {
                                            rootItemPath = splitPath[0];
                                        } else {
                                            if (splitPath.length > 1) {
                                                rootItemPath = splitPath[1];
                                            }
                                        }
                                    }

                                    if (rootItemPath !== '') {
                                        console.log('Root item path: ' + rootItemPath);
                                        await admin.firestore().collection('items').doc(rootItemPath).get()
                                            .then(doc => {
                                                if (doc && doc.exists && doc.data()) {
                                                    console.log('doc exists')
                                                    const docData = doc.data();
                                                    if (docData && docData.users) {
                                                        console.log('Document users: ', docData.users);
                                                        if (docData.users.indexOf(decodedUserUid) < 0) {
                                                            console.error('401: Unathorized');
                                                            throw new CustomError('You are not authorized to do this', 401);
                                                        }
                                                    } else {
                                                        console.error('401: Unathorized');
                                                        throw new CustomError('You are not authorized to do this', 401);
                                                    }
                                                } else {
                                                    console.error('401: Unathorized');
                                                    throw new CustomError('You are not authorized to do this', 401);
                                                }
                                            })
                                            .catch(err => {
                                                console.error(err);
                                                throw new CustomError('You are not authorized to do this', 401);
                                            });
                                    }
                                    else {
                                        console.error('401: Unathorized');
                                        throw new CustomError('You are not authorized to do this', 401);
                                    }
                                } else {
                                    console.error('401: Unathorized');
                                    throw new CustomError('You are not authorized to do this', 401);
                                }

                            }).catch(err => {
                                console.error(err);
                                throw err;
                            });

                        console.log('Before stream: ' + response.getHeader('Content-Type') + ', ' + response.getHeader('Content-Disposition'));
                        // Create Read Stream from file and piped to the response.
                        await bucket.file(filePath).createReadStream()
                            .on('complete', () => {
                                console.log('Finish event emitted');

                                response.end();
                            })
                            .on('error', err => {
                                console.error(err);
                                throw err;
                            })
                            .pipe(response)
                            .on('complete', () => {
                                console.log('Finish event emitted');

                                response.end();
                            })
                            .on('error', err => {
                                console.error(err);
                                throw err;
                            });
                        console.log('after stream');
                    } else { // In case the path is not set.
                        console.log('Path: ' + data.path);
                        throw new CustomError('Not supported path', 404);
                    }
                } else { // In case the request is not a post.
                    console.log('Method: ' + request.method);
                    throw new CustomError('Request not supported, only POST', 405);
                }
            } catch (error) {
                console.error(error);
                if (error instanceof CustomError) {
                    response.status(error.errorStatus).send(error.message);
                } else {
                    response.status(500).send('Something unexpected happened. Contact the administrator team');
                }
            }
            console.log('Should it hit this?');
        });
    });
