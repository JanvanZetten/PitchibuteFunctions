import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as corsModule from 'cors';

const corsHandler = corsModule({origin: true});

exports.getPathItems = functions.https.onRequest((request, response) => {
    
    corsHandler(request, response, () => {
        if (request.method === 'GET') {
            // @ts-ignore
            const params = request.headers['uid'];
            const path = request.headers['path'];
            // @ts-ignore
            const token = request.headers['authorization'];

            // @ts-ignore
            admin.firestore().collection(path.toString())
            // The where below is used to filter the returned list, but doesn't work unless a valid uid is sent over
            // It is unsure if this is how it should filter since it would require all items to have a users field
            /*.where('users', 'array-contains', params)*/
                .get().then(items => {
                const listOfItems: any = [];
                items.forEach(item => {
                    const i = {
                        id: item.id,
                        ...item.data()
                    };
                    listOfItems.push(i);
                });
                response.json(listOfItems);
            }).catch(err => {console.log(err)})
        } else {
            console.log('Method: ' + request.method);
            response.send("Only supports GET requests")
        }
    });

});
    