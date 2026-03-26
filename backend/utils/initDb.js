const fs = require("fs/promises");
const path = require("path");

const pool = require("../db");

let initPromise;

async function ensureDatabaseReady() {
  if (!initPromise) {
    initPromise = (async () => {
      const schemaPath = path.resolve(__dirname, "../../sql/schema.sql");
      const schema = await fs.readFile(schemaPath, "utf8");
      await pool.query(schema);
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

module.exports = {
  ensureDatabaseReady
};
