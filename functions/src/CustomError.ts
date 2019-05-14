export class CustomError extends Error{

     errorStatus: number;
    constructor(message: string, errorStatus: number) {
        super(message);
        this.errorStatus = errorStatus;
    }

}
