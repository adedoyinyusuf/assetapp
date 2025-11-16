import { testClient, resetDbStore } from './test-client';

export async function seedTestData() {
  // Seed basic lookup data used by services
  const { store } = testClient as any;

  // Seed states
  store.state = [
    { id: 1, name: 'State One' },
    { id: 2, name: 'State Two' },
    { id: 3, name: 'State Three' },
  ];

  // Seed categories
  store.category = [
    { id: 5, name: 'Category Five' },
    { id: 6, name: 'Category Six' },
    { id: 7, name: 'Category Seven' },
  ];

  // Seed LGAs
  store.lGA = [
    { id: 10, name: 'LGA Ten', stateId: 1 },
    { id: 11, name: 'LGA Eleven', stateId: 2 },
    { id: 12, name: 'LGA Twelve', stateId: 3 },
  ];
}

export async function cleanupTestData() {
  resetDbStore();
}