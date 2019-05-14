import {Request} from "firebase-functions/lib/providers/https";
import {Response} from "firebase-functions";
import * as admin from "firebase-admin";
import DecodedIdToken = admin.auth.DecodedIdToken;
import {CustomError} from "./CustomError";

export class Authorization {


    validateFirebaseIdToken(req: Request, res: Response) {
        // @ts-ignore
        if (!req.get('Authorization') || !req.get('Authorization').startsWith('Bearer ')) {
            throw new CustomError('Missing authorization header', 400)
        }
    };

    verifyToken(tokenBearer: string): Promise<DecodedIdToken> {
        const token = tokenBearer.split('Bearer ')[1];
        return admin.auth().verifyIdToken(token);
    }

}
