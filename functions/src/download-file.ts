import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as corsModule from 'cors';
const cors = corsModule({
    origin: true, exposedHeaders: ['Content-Type', 'Content-Disposition', 'File-Name'] });

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

            if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
                console.log('Found "Authorization" header: ' + request.headers.authorization.split('Bearer ')[1]);
            } else if (request.cookies) {
                console.log('Found "__session" cookie: ' + request.cookies.__session);
            }

            if (request.method === 'POST') {
                // Read Data from Request
                const data = request.body;

                if (data.path) {
                    // Get file path from body.
                    const filePath = data.path;

                    // Bucket to use.
                    const bucket = admin.storage().bucket();

                    // Get metadata.
                    await bucket
                        .file(filePath)
                        .getMetadata().then(function (dataArr: any) {
                            const filemetadata = dataArr[0];
                            console.log('contentType: ' + filemetadata.contentType + ', originalName: ' + filemetadata.metadata.originalName);

                            // The content type and original file name is used for the HTTP Request Header.
                            // Double quotes is used in the originalName because of spaces.
                            response.writeHead(200, {
                                'Content-Type': filemetadata.contentType,
                                'Content-Disposition': 'attachment; filename="' + filemetadata.metadata.originalName + '"',
                                'File-Name': '"' + filemetadata.metadata.originalName + '"',
                            });
                        }).catch(function (err: any) {
                            console.error(err);
                        });

                    // Create Read Stream from file and piped to the response.
                    await bucket.file(filePath).createReadStream()
                        .on('complete', () => {
                            console.log('Finish event emitted');

                            response.end();
                        })
                        .on('error', err => {
                            console.error(err);
                        })
                        .pipe(response)
                        .on('complete', () => {
                            console.log('Finish event emitted');

                            response.end();
                        })
                        .on('error', err => {
                            console.error(err);
                        });
                } else { // In case the path is not set.
                    console.log('Path: ' + data.path);
                    response.send("Not supported path");
                }
            } else { // In case the request is not a post.
                console.log('Method: ' + request.method);
                response.send("Not support request, only POST");
            }
        });
    });