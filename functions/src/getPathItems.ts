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
                }).catch(error => {
                    throw new CustomError('You are not authorized', 403);
                });

                // @ts-ignore
                await helper.getCollection(path[0]).then(async snapShot => {
                    // @ts-ignore
                    const data = snapShot.data();
                    // @ts-ignore
                    await admin.firestore().collection(path.toString())
                        /*.where('users', 'array-contains', userRequestUid)*/
                        .get().then(items => {
                            const listOfItems: any = [];
                            items.forEach(item => {
                                if (helper.apartOfGroup(data.users, userRequestUid)) {
                                    const i = {
                                        id: item.id,
                                        ...item.data()
                                    };
                                    listOfItems.push(i);
                                }
                            });
                            response.json(listOfItems);
                        }).catch(err => {
                            console.log(err)
                        })
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
    