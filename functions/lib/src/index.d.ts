import * as functions from "firebase-functions";
import * as functionsV1 from "firebase-functions/v1";
export declare const onSettlementCreated: functionsV1.CloudFunction<functionsV1.firestore.QueryDocumentSnapshot>;
export declare const onSettlementMarkedSettled: functionsV1.CloudFunction<functions.firestore.Change<functionsV1.firestore.QueryDocumentSnapshot>>;
