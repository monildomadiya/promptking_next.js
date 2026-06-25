require('dotenv').config({path: '.env.local'});
import('./lib/db.js').then(({ default: db }) => {
  db`DESCRIBE website_categories`
    .then(r => console.log(r))
    .catch(e => console.error(e));
});
