require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  
  // Get users
  const erdem = await client.query('SELECT * FROM "User" WHERE name = $1', ['Erdem Günaydın']);
  const kaan = await client.query('SELECT * FROM "User" WHERE name = $1', ['Kaan']);
  
  if (erdem.rows.length && kaan.rows.length) {
    const eUser = erdem.rows[0];
    const kUser = kaan.rows[0];
    
    // Get project id
    const proj = await client.query('SELECT "projectId" FROM "ProjectMember" WHERE "userId" = $1', [kUser.id]);
    const projectId = proj.rows[0].projectId;
    
    // Create team
    // Insert team
    const teamRes = await client.query(`
      INSERT INTO "Team" (id, "projectId", name, "createdAt", "updatedAt") 
      VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id
    `, ['cm_team_erdem123', projectId, "Erdem Günaydın'ın Ekibi"]);
    const teamId = teamRes.rows[0].id;
    
    // Insert team members
    await client.query(`
      INSERT INTO "TeamMember" (id, "teamId", "userId", role, "joinedAt")
      VALUES ($1, $2, $3, $4, NOW())
    `, ['cm_tm_erdem', teamId, eUser.id, 'owner']);
    
    await client.query(`
      INSERT INTO "TeamMember" (id, "teamId", "userId", role, "joinedAt")
      VALUES ($1, $2, $3, $4, NOW())
    `, ['cm_tm_kaan', teamId, kUser.id, 'member']);
    
    console.log("Team created for Erdem and Kaan!");
  }
  
  await client.end();
}
main().catch(console.error);
