import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/*const cors = corsModule(
    {origin:true})*/


exports.getMainGroups = functions.https.onRequest((request, response) => {

    if (request.method === 'GET') {
        
        let params = request.headers['uid'];
        let path = request.headers['path'];
        
        // @ts-ignore
        admin.firestore().collection(path.toString())
            .where('users', 'array-contains', params)
            .get().then(groups => {
            const listOfGroups: any = [];

            groups.forEach(item => {
                const group = item.data();
                listOfGroups.push(group);
            })
            response.json(listOfGroups);
        }).catch(err => {console.log(err)})
    } else {
        console.log('Method: ' + request.method);
        response.send("Only supports GET requests")
    }

});
    