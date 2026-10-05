import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import pg from 'pg';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL || process.env.DATABASE_URL;
const migrationSql = fs.readFileSync(new URL('../database/migrations/016_conexao_ela_registration.sql', import.meta.url), 'utf8');

test('Conexão Ela migration preserves lifetime access for existing project members to lifetime access', { skip: !databaseUrl }, async () => {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query('begin');
  try {
    const project = await client.query("select id from projects where slug='conexao-ela'");
    assert.ok(project.rows[0]?.id, 'conexao-ela project must exist after migrations');

    const userId = crypto.randomUUID();
    const email = `migration-${userId}@example.test`;
    await client.query('insert into users(id,email,password_hash) values($1,$2,$3)', [userId, email, 'test-hash']);
    await client.query("insert into project_users(project_id,user_id,role) values($1,$2,'member')", [project.rows[0].id, userId]);
    await client.query(
      "insert into subscriptions(project_id,user_id,status,trial_started_at,trial_ends_at) values($1,$2,'trialing',now(),now()+interval '7 days')",
      [project.rows[0].id, userId],
    );

    await client.query(migrationSql);

    const subscription = await client.query(
      'select status,trial_ends_at,current_period_end from subscriptions where project_id=$1 and user_id=$2',
      [project.rows[0].id, userId],
    );
    assert.equal(subscription.rows[0]?.status, 'lifetime');
    assert.equal(subscription.rows[0]?.trial_ends_at, null);
    assert.equal(subscription.rows[0]?.current_period_end, null);
  } finally {
    await client.query('rollback');
    await client.end();
  }
});
