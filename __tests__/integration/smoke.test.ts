jest.unmock('@/lib/db/db-client');
import { createTestDb, TestDb } from '@/tests/helpers/test-db';
import * as q from '@/lib/db/queries';
import { getDb } from '@/lib/db/db-client';
import { transactions } from '@/lib/db/schema';

let db: TestDb;
beforeEach(async () => { db = await createTestDb(); });
afterEach(() => db.close());

it('migrates, seeds and queries', async () => {
  const cats = await q.getCategories();
  expect(cats.length).toBeGreaterThan(5);
  const accts = await q.getAccounts();
  console.log(accts.map(a => a.name), db.raw.pragma('foreign_keys'));
  const t = await q.createTransaction({ amount: 10, type: 'income', category_id: cats[0].id, account_id: accts[0].id, date: '2026-01-01' } as any);
  console.log('created', t);
  expect(await q.getCurrentBalance()).toBe(10);
});

it('async callback in db.transaction does not roll back', async () => {
  const d = getDb();
  await expect(d.transaction(async (tx) => {
    await tx.insert(transactions).values({ amount: 5, type: 'income', category_id: 1, account_id: 1, date: '2026-01-01' } as any);
    throw new Error('boom');
  })).rejects.toThrow('boom');
  console.log('rows after failed tx', db.raw.prepare('select count(*) c from transactions').get());
});
