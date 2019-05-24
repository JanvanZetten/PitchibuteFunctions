import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as corsModule from 'cors';
import {Authorization} from "./authorization";
import {CustomError} from "./custom-error";
import {Helper} from "./helpers/helper";

const corsHandler = corsModule({origin: true});

exports.getPathItems = functions.https.onRequest((request, response) => {

    corsHandler(request, response, async () => {
        // @ts-ignore
        const path = request.headers['path'];
        const auth = new Authorization();
        const helper = new Helper();

        let userRequestUid: string;

        if (request.method === 'GET') {
            try {
                const tokenBearer = auth.validateFirebaseIdToken(request);

                await auth.verifyToken(tokenBearer).then(token => {
                    userRequestUid = token.uid;
                    console.log(userRequestUid);
                    // @ts-ignore
                    console.log(path[0].toString())
                }).catch(error => {
                    throw new CustomError('You are not authorized', 403);
                });

                // @ts-ignore
                await helper.getCollection(path[0].toString()).get().then(items => {
                    const listOfItems: any = [];
                    // @ts-ignore
                    items.forEach(item => {
                        if (helper.apartOfGroup(item.users, userRequestUid)) {
                            const i = {
                                id: item.id,
                                ...item.data()
                            };
                            listOfItems.push(i);
                        }
                    });
                    response.json(listOfItems);
                });
            } catch (error) {
                console.log(error);
            }
        } else {
            console.log('Method: ' + request.method);
            response.send("Only supports GET requests")
        }
    });

});
    