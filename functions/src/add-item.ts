import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as corsModule from 'cors';

const cors = corsModule({
    origin: true, exposedHeaders: ['authorization']
});


exports.addItem =
    functions.https.onRequest(
        (request, response) => {
            cors(request, response, async () => {
                // There should be a new item and a path to where the user wants it
                const path = request.body.path as Item[]
                const newItem = request.body.newItem as Item

                path === undefined ? console.log("The path is undefinded") : {};
                newItem === undefined ? console.log("The newItem is undefinded") : {};

                // Check that the user can edit in the group
                const idToken = request.headers['authorization']

                console.log(`The token is ${idToken}`)

                if (idToken === undefined) {
                    console.log('A user has been given status 401 because the token was undefined')
                    response.sendStatus(401)
                }

                const decodedToken = await admin.auth().verifyIdToken((idToken as string).split(" ")[1])
                const uid = decodedToken.uid

                const docIds: string[] = []

                path.forEach(item => item.id ? docIds.push(item.id) : response.sendStatus(400))

                const ITEMS = 'items'

                if (path.length !== 0) {
                    // It is not the outermost item 
                    const groupDocRef = admin.firestore().collection(ITEMS).doc(docIds[0])

                    const groupDoc = await groupDocRef.get()

                    const users = groupDoc.get('users') as string[]

                    if (users === undefined || users === null) {
                        console.log('Outermost item is missing users')
                        response.sendStatus(500)
                    }

                    const user = users.find(u => u === uid)
                    if (user === undefined) {
                        console.log(`A user id ${uid}, has tried to add somthing to a group where the user was not a part of.`)
                        response.sendStatus(401)
                    }
                } else {
                    // It is the outermost item which needs an array of users
                    newItem.users = [uid]
                }

                // Insert the new item
                let collection = admin.firestore().collection(ITEMS)

                docIds.forEach(docId => {
                    if (docId !== '') {
                        collection = collection.doc(docId).collection(ITEMS)
                    }
                })

                collection.add(newItem).then(v => {
                    response.statusCode = 200;
                    response.send({ id: v.id })
                }, e => response.sendStatus(500))
            })
        });

interface Item {
    name: string,
    type: type,
    id?: string,
    items?: Item[],
    resources?: Item[]
    startDate?: Date,
    endDate?: Date,
    url?: string,
    users?: string[]
}

enum type {
    group, event, folder, file, link
}
