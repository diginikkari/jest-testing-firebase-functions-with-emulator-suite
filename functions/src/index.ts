import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';

interface Company {
  name: string;
  nameInLowerCase?: string;
  createdAt?: admin.firestore.Timestamp;
}

export const createCompany = functions.firestore.document('/companies/{companyId}').onCreate(onCreateCompany);

async function onCreateCompany(snapshot: DocumentSnapshot, context: functions.EventContext) {
  const company = snapshot.data() as Company;
  const changes = {} as Company;
  const promises = [] as Promise<any>[];

  // Add createdAt timestamp
  changes.createdAt = admin.firestore.Timestamp.fromDate(new Date(context.timestamp));

  // add lowercase name
  changes.nameInLowerCase = company.name.toLowerCase();

  // Update only changed properties
  if ((await snapshot.ref.get()).exists) promises.push(snapshot.ref.update(changes));

  // Increase companies count to aggregated company counts document
  promises.push(
    admin
      .firestore()
      .collection('counts')
      .doc('companies')
      .set({ totalCount: admin.firestore.FieldValue.increment(1) }, { merge: true })
  );

  // return promises array so that promises are resolved in parallel.
  return Promise.all(promises);
}
