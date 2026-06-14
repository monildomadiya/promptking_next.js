
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Compatibility wrapper for MySQL to support tagged template literals
 * like the 'postgres' library.
 */
const sql = (strings, ...values) => {
  if (!Array.isArray(strings)) {
    // Handle the sql(identifier) case
    return { type: 'identifier', value: strings };
  }

  // Tagged template case - returns a promise
  return (async () => {
    let finalValues = [];
    let query = '';
    
    for (let i = 0; i < strings.length; i++) {
        query += strings[i];
        if (i < values.length) {
            const v = values[i];
            if (v && typeof v === 'object' && v.type === 'identifier') {
                query += '`' + v.value.replace(/`/g, '``') + '`';
            } else if (Array.isArray(v)) {
                // Handle IN (?) where v is ['a', 'b']
                query += '(' + v.map(() => '?').join(', ') + ')';
                finalValues.push(...v);
            } else {
                query += '?';
                finalValues.push(v);
            }
        }
    }

    try {
      const [rows] = await pool.query(query, finalValues);
      return rows;
    } catch (error) {
      console.error('DATABASE QUERY ERROR:', error);
      console.error('QUERY:', query);
      throw error;
    }
  })();
};

// Add helper for identifiers
sql.db = (name) => '`' + name.replace(/`/g, '``') + '`';

export default sql;
