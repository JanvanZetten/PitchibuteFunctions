import {Request} from "firebase-functions/lib/providers/https";
import * as admin from "firebase-admin";
import DecodedIdToken = admin.auth.DecodedIdToken;
import {CustomError} from "./CustomError";

export class Authorization {


    validateFirebaseIdToken(req: Request): string {
        const authorization = req.get('Authorization');
        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new CustomError('Missing authorization header', 400)
        } else {
            return authorization;
        }
    };

    verifyToken(tokenBearer: string): Promise<DecodedIdToken> {
        const token = tokenBearer.split('Bearer ')[1];
        return admin.auth().verifyIdToken(token);
    }

}
