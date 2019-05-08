import {Request} from "firebase-functions/lib/providers/https";
import {Response} from "firebase-functions";
import * as admin from "firebase-admin";

export class Authorization {


    static validateFirebaseIdToken(req: Request, res:Response) {
        // @ts-ignore
        if(!req.get('Authorization') || !req.get('Authorization').startsWith('Bearer ')) {
            res.status(403).send('Missing authorization header');
            return;
        }
    };

    static verifyToken(token: string){
       return admin.auth().verifyIdToken(token);
    }

}
