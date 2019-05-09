import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GetSignedUrlConfig } from '@google-cloud/storage';

/**
 * Works with HTTP GET Request.
 * Gets all download URLs for all files in the files firebase storage path
 * URL: https://us-central1-pitchibute.cloudfunctions.net/testdownloadfile
 */ 
exports.testdownloadfile =
    functions.https.onRequest(
    (request, response) => {
        // Checks if Get request.
        if (request.method === 'GET') {
            // Get all files from files/ in firebase storage.
            admin.storage()
                .bucket()
                .getFiles({ prefix: 'files/', delimiter: '/'},
                    (err, files) => {
                        // If no error has occured and the file is not undefined.
                        if (!err && files !== undefined) {
                            const promises = new Array<Promise<void>>(); // For promises.
                            const results = new Array<string>(); // For URLs.
                            const config: GetSignedUrlConfig = {
                                action: 'read',
                                expires: Date.now() + 300000
                            }; // URL Rules. Read-only available for 5 minutes

                            // Loop files.
                            files.forEach(file => {
                                // Add promise to Array. Promise gets signed URLs. 
                                promises.push(file.getSignedUrl(config).then(url => {
                                    // For some reason the url is in an weird [string] array.
                                    if (url.length > 0) {
                                        // Add the URL to the Array results.
                                        results.push(url[0]);
                                    } else {
                                        console.log("A URL was not created probably for '" + file.name + "'");
                                        response.send("A URL was not created probably for '" + file.name + "'");
                                    }
                                }).catch(err2 => {
                                    console.log(err2);
                                    response.send(err2);
                                }));
                            });

                            // Wait for all promises to resolve and return results.
                            Promise.all(promises).then(() => {
                                response.json(results);
                            }).catch(err2 => {
                                console.log(err2);
                                response.send(err2);
                            });
                        } else {
                            if (err) {
                                console.log(err);
                                response.send(err);
                            } else {
                                console.log("No files was found");
                                response.send("No files was found");
                            }
                        }
                    }
            );
        } else { // Return Method not available in other cases.
            response.send('HTTP Method not available');
        }
    }
);