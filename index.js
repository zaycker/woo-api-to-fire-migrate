const http = require('http');
const https = require('https');

const request = (protoModule, params) => new Promise((resolve, reject) => {
    const req = protoModule.request(params, function (res) {
        // reject on bad status
        if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject([new Error('statusCode=' + res.statusCode), req]);
        }

        let body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        // resolve on end
        res.on('end', function () {
            resolve([body, req]);
        });
    });
    // reject on request error
    req.on('error', function (err) {
        // This is not a "Second reject", just a different sort of failure
        reject([err, req]);
    });
    // IMPORTANT
    req.end();
});

const httpRequest = (...options) => request(http, ...options);

const httpsRequest = (...options) => request(https, ...options);

const processCollection = async (db, data, collectionPath) => {
    const json = JSON.parse(data);

    return Promise.all(json.map(async doc => {
        try {
            return db.collection(collectionPath).doc(String(doc.id)).set(doc);
        } catch (e) {
            console.log(e);
        }
    }));
};

const getOptions = ({ perPage = 50, page = 1, config: { host, username, password, collection } } = {}) => ({
    host,
    path: `/wp-json/wc/v3/${collection}?per_page=${perPage}&page=${page}`,
    auth: `${username}:${password}`,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
    }
});

async function migrateData(config) {
    try {
        console.log(`request of page 1 of '${config.collection}'`);
        const [data, req] = await httpsRequest(getOptions({ config }));
        console.log(`processing of page 1 of '${config.collection}'`);
        await processCollection(config.db, data, config.collection);
        const numOfPages = parseInt(req.res.headers['x-wp-totalpages'], 10);

        // NaN check also here
        if ( !(numOfPages > 1) ) {
            return;
        }

        // Consequent requests. Tried Promise.all(), woocommerce dies.
        let page = 1;
        while (++page <= numOfPages) {
            console.log(`request of page ${page} of ${numOfPages} of '${config.collection}'`);
            const [data] = await httpsRequest(getOptions({ config, page }));
            console.log(`processing of page ${page} of ${numOfPages} of '${config.collection}'`);
            await processCollection(config.db, data, config.collection);
        }
    } catch ([e, req]) {
        console.log(e, req);
    }
}

module.exports = {
    httpRequest,
    httpsRequest,
    migrateData
};