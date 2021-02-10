import * as firebase from '@firebase/testing';
import functions from 'firebase-functions-test';
import admin from 'firebase-admin';

interface Company {
  name: string;
  nameInLowerCase: string;
  createdAt: admin.firestore.Timestamp;
}

// create testenv for mocking changes
const testEnv = functions();

// First set up unique project id for these tests, so that any other test files run in parallel
// is not collapsing with this one.
const projectId = 'sample' + new Date().getTime();

// initialize test database
process.env.GCLOUD_PROJECT = projectId;
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
admin.initializeApp({ projectId });

const db = admin.firestore();

import { createCompany } from '.';

let wrapped: any;

// Create documentReference with created test database
const companyRef = db.collection('companies').doc('companyId1');

describe('Sample tests', () => {
  beforeAll(() => {
    // Creates wrapped test function from cloud function which can be called in tests
    wrapped = testEnv.wrap(createCompany);
  });

  beforeEach(async () => {
    // Clean database before each test
    await firebase.clearFirestoreData({ projectId });
  });

  test('it should add lowercase name', async () => {
    const data = { name: 'Testers Inc.' };

    // write actual document to database
    await companyRef.set(data);

    // get document snapshot
    const afterSnap = await companyRef.get();

    // create sample context
    const context = {
      timestamp: '2018-03-23T17:27:17.099Z'
    };

    // Execute the function
    await wrapped(afterSnap, context);

    const companySnapshot = await companyRef.get();
    const companyAfterCreate = companySnapshot.data() as Company;

    // Assert results
    expect(companyAfterCreate.nameInLowerCase).toBe('testers inc.');
  });

  test('it should add createdAt', async () => {
    const data = { name: 'Testers Inc.' };

    // write actual document to database
    await companyRef.set(data);

    // get document snapshot
    const afterSnap = await companyRef.get();

    // create sample context
    const context = {
      timestamp: '2018-03-23T17:27:17.099Z'
    };

    // Execute the function
    await wrapped(afterSnap, context);

    const companySnapshot = await companyRef.get();
    const companyAfterCreate = companySnapshot.data() as Company;

    // Assert results
    expect(companyAfterCreate.createdAt).toMatchObject(admin.firestore.Timestamp.fromDate(new Date(context.timestamp)));
  });

  test('it should increase companies count', async () => {
    const data = { name: 'Testers Inc.' };

    // write actual document to database
    await companyRef.set(data);

    // get document snapshot
    const afterSnap = await companyRef.get();

    // create sample context
    const context = {
      timestamp: '2018-03-23T17:27:17.099Z'
    };

    // Execute the function
    await wrapped(afterSnap, context);

    // Get document under evaluation
    const countsDocSnapshot = await db
      .collection('counts')
      .doc('companies')
      .get();
    const countsAfterCreate = countsDocSnapshot.data() as { totalCount: number };

    // Assert results
    expect(countsAfterCreate.totalCount).toBe(1);
  });
});
