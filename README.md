### Example of migration entities from woocommerce API to Firestore
- Make `config.js` with kind of auth data:
```js
const woo = {
  host: 'example.com',
  username: 'ck_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  password: 'cs_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};

const firebase = {
  "apiKey": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "authDomain": "example.firebaseapp.com",
  "databaseURL": "https://example.firebaseio.com",
  "projectId": "example",
  "storageBucket": "",
  "messagingSenderId": "XXXXXXXXXXXX",
  "appId": "1:XXXXXXXXXXXX:web:ZZZZZZZZZZZZZZZZ"
};

module.exports = {
  firebase,
  woo
};
```

- Add modules to project

```npm i firebase zaycker/woo-api-to-fire-migrate```

- Create migration script like this `index.js`:
```js
const firebase = require('firebase');
const { migrateData } = require('woo-api-to-fire-migrate');
const config = require('./config');

// Required for side-effects
require('firebase/firestore');


// Initialize Cloud Firestore through Firebase
firebase.initializeApp(config.firebase);

const db = firebase.firestore();

const collections = [
    'products',
    'orders'
];

// Consequent requests
(async () => collections.reduce((promise, collection) => promise.then(() => migrateData({
    collection: collection,
    host: config.woo.host,
    username: config.woo.username,
    password: config.woo.password,
    db,
})), Promise.resolve()))();
```

- `node index.js` to migrate two API entities `products` and `orders`