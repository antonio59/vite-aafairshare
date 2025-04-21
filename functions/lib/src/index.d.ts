import * as functions from "firebase-functions/v1";
export declare const onSettlementCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onSettlementMarkedSettled: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
