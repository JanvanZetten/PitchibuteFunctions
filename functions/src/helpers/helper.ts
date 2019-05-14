import * as admin from "firebase-admin";
import {CustomError} from "../custom-error";

export class Helper {

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

    apartOfGroup(users: string [], userId: string): boolean {
        return users.indexOf(userId) !== -1;
    }

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

    getUserByEmail(email: string) {

        // Retrieving the data about the user, to get the user-id.
        // Await so we wont go further with code until we get the data.
        return admin.auth().getUserByEmail(email);
    }

    getCollection(collection: string) {
        return admin.firestore().collection(collection).get();
    }

    getDocument(collection: string, doc:string) {
        return admin.firestore().collection(collection).doc(doc).get();
    }

    nameChecker(nameSnap: string, newName:string) {

        if (nameSnap === newName) {
            throw new CustomError(  'Group/Item already has that name', 400);
        }

    }
}
