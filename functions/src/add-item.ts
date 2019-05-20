import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'


exports.addItem =
    functions.https.onRequest(
        (request, response) => {
            // There should be a new item and a path to where the user wants it
            const path = request.body.path as Item[]
            const newItem = request.body.newItem as Item

            // TODO check if the user is part of the group they wihsh to add an item to

            



            // Insert the new item
            const docIds: string[] = []
            path.forEach(item => item.id ? docIds.push(item.id) : response.sendStatus(400))

            const ITEMS = 'items'

            let collection = admin.firestore().collection(ITEMS)

            docIds.forEach(docId => {
                if (docId !== '') {
                    collection = collection.doc(docId).collection(ITEMS)
                }
            })

            collection.add(newItem).then(v => {
                response.statusCode = 200;
                response.send(v.id)
            }, e => response.sendStatus(500))
        });

interface Item {
    name: string,
    type: type,
    id?: string,
    items?: Item[],
    resources?: Item[]
    startDate?: Date,
    endDate?: Date,
    url?: string
}

enum type {
    group, event, folder, file, link
}
