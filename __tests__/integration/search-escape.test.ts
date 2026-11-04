jest.unmock('@/lib/db/db-client');
import { likePattern } from '@/features/transactions/hooks/use-transactions';
import { createTestDb, TestDb } from '@/tests/helpers/test-db';

let db: TestDb;
beforeEach(async () => { db = await createTestDb(); });
afterEach(() => db.close());

const search = (term: string, rows: string[]) => {
  db.raw.exec('create temp table notes(n text)');
  const ins = db.raw.prepare('insert into notes values (?)');
  rows.forEach(r => ins.run(r));
  return (db.raw.prepare("select n from notes where n like ? escape '\\'").all(likePattern(term)) as { n: string }[]).map(r => r.n);
};

describe('search treats % and _ as plain characters', () => {
  it('"%" only matches notes that contain a percent sign', () => {
    expect(search('%', ['50% off', 'groceries'])).toEqual(['50% off']);
  });
  it('"_" only matches a literal underscore', () => {
    expect(search('a_b', ['a_b', 'axb'])).toEqual(['a_b']);
  });
  it('ordinary words still match anywhere', () => {
    expect(search('rent', ['Rent May', 'parent', 'food'])).toEqual(['Rent May', 'parent']);
  });
});
