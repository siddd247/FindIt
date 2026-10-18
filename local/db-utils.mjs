/** Run a callback atomically with either the async adapter or a legacy sync test DB. */
export async function withTransaction(db, callback) {
  if (typeof db.transaction === 'function') return db.transaction(callback);
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = await callback(db);
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
