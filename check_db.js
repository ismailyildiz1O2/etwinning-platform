require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query('SELECT username, name, role FROM "User"');
  console.log("Users:", res.rows);
  const mems = await client.query('SELECT * FROM "Team"');
  console.log("Teams:", mems.rows);
  await client.end();
}
main().catch(console.error);
