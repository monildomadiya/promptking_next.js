const db = require('./db'); 
db`SHOW CREATE TABLE prompts`.then(r => console.log(r[0]['Create Table'])).catch(console.error).finally(()=>process.exit());
