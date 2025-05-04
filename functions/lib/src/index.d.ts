import * as functions from "firebase-functions";
import * as firestoreV1 from "firebase-functions/v1/firestore";
export declare const onSettlementCreated: import("firebase-functions/lib/v1/cloud-functions.js").CloudFunction<firestoreV1.QueryDocumentSnapshot>;
export declare const onSettlementMarkedSettled: import("firebase-functions/lib/v1/cloud-functions.js").CloudFunction<functions.firestore.Change<firestoreV1.QueryDocumentSnapshot>>;
