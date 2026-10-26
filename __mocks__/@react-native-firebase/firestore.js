module.exports = {
  FieldValue: { serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })) },
  collection: jest.fn((...args) => ({ kind: 'collection', args })),
  doc: jest.fn((...args) => ({ kind: 'doc', args })),
  getDoc: jest.fn(async () => ({ exists: () => false, data: () => ({}) })),
  getDocs: jest.fn(async () => ({ docs: [], forEach: () => {} })),
  getFirestore: jest.fn(() => ({ kind: 'firestore' })),
  limit: jest.fn((value) => ({ kind: 'limit', value })),
  orderBy: jest.fn((field, direction) => ({ kind: 'orderBy', field, direction })),
  query: jest.fn((...args) => ({ kind: 'query', args })),
  setDoc: jest.fn(async () => {}),
};
module.exports.default = module.exports;
