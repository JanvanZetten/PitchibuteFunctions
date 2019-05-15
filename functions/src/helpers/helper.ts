import * as admin from "firebase-admin";
import {CustomError} from "../custom-error";

/**This class is simply a helper class, which can be used all over - Basically so you don't have to repeat yourself.**/

export class Helper {

    // Adding user to collection.
    addNewUser(collection: string, doc: string, users: string[]) {
        // Merging data.(adding new user)
        admin.firestore().collection(collection).doc(doc).set({
                users: users
            },
            {merge: true}
        ).catch(error => {
            console.log(error);
            throw new CustomError('Could not add user to the group, contact administrator team.',
                400);
        });
    }

    // Renaming item.
    renameItem(collection: string, doc: string, name: string) {
        admin.firestore().collection(collection).doc(doc).set({
                name: name
            },
            {merge: true}).catch(error => {
            console.log(error);
            throw new CustomError('Could not edit name of selected item, contact administrator team',
                400);
        });
    }

    // Checking if a user is apart of the array.
    apartOfGroup(users: string [], userId: string): boolean {
        return users.indexOf(userId) !== -1;
    }

    // Adding user to array if the one trying to add him is apart of it.
    addUserToGroupIfAuthorized(users: string [], userId: string, decodedUserUid: string) {
        if (this.apartOfGroup(users, decodedUserUid)) {
            if (users.indexOf(userId) === -1) {
                users.push(userId);
            } else {
                throw new CustomError('User is already in group', 400);
            }
        } else {
            throw new CustomError('You are not authorized to do that.', 403);
        }
    }

    // Retrieving UID by his email
    getUserByEmail(email: string) {

        // Retrieving the data about the user, to get the user-id.
        // Await so we wont go further with code until we get the data.
        return admin.auth().getUserByEmail(email);
    }

    // Method to get collection.
    getCollection(collection: string) {
        return admin.firestore().collection(collection).get();
    }

    // Used to find a collection and specific document.
    getDocument(collection: string, doc:string) {
        return admin.firestore().collection(collection).doc(doc).get();
    }

    // Namechecking if name is already the same.
    nameChecker(nameSnap: string, newName:string) {

        if (nameSnap === newName) {
            throw new CustomError(  'Group/Item already has that name', 400);
        }

    }
}
