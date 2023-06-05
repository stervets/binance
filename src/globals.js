import _ from 'underscore';
import $ from 'jquery';
import roboto from 'roboto-fontface';

let config = {
    TABLE_WIDTH      : 36,
    MIN_WIDGET_WIDTH : 8,
    MIN_WIDGET_HEIGHT: 5,
    MAX_DATA_LENGTH  : 100,

    firebase: {
        databaseURL: "https://binance-8098a-default-rtdb.europe-west1.firebasedatabase.app/",
    },

    coins: {
        btc  : 'Bitcoin',
        eth  : 'Ethereum',
        bnb  : 'Binance Coin',
        ada  : 'Cardano',
        xrp  : 'Ripple',
        doge : 'Dogecoin',
        dot  : 'Polkadot',
        sol  : 'Solana',
        uni  : 'Uniswap',
        link : 'Chainlink',
        matic: 'Polygon',
        bnx  : 'BinaryX',
        //help : 'Help Widget'
    }
};

let chain = function (functions, ...data) {
    return new Promise(async resolve => {
        let func = functions.shift(),
            res  = [];
        res.push(await func.call(this, ...data));
        functions.length && res.push.apply(res, await chain(functions, ...data))
        resolve(res);
    });
};

_.mixin({
    chain,

    genId() {
        return `${Date.now()}-${performance.now()}-${Math.random().toString().slice(2)}`.replace('.', '-');
    },

    bind(obj, context) {
        Object.keys(obj).forEach((key) => {
            typeof obj[key] == 'function' && (obj[key] = obj[key].bind(context));
        });
        return obj;
    },

    deep: function (obj, key, value) {
        if (!obj) {
            return;
        }

        var keys = key.replace(replacer1, '.$2').replace(replacer2, '').split('.'),
            root,
            i    = 0,
            n    = keys.length;

        // Set deep value
        if (arguments.length > 2) {

            root = obj;
            n--;

            while (i < n) {
                key = keys[i++];
                obj = obj[key] = _.isObject(obj[key]) ? obj[key] : {};
            }

            obj[keys[i]] = value;

            value = root;

            // Get deep value
        } else {
            while ((obj = obj[keys[i++]]) != null && i < n) {
            }
            value = i < n ? void 0 : obj;
        }

        return value;
    },

    deepClone: function (obj) {
        if (_.isUndefined(obj)) {
            return;
        }

        return JSON.parse(JSON.stringify(obj));
    },

    random(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    async timeout(delay) {
        return new Promise((resolve) => {
            setTimeout(resolve, delay);
        });
    }
});

config.userId = localStorage.getItem('userId');
if (!config.userId) {
    _.extend(config, {
        userId: _.genId(),
        firstStart: true
    });
    localStorage.setItem('userId', config.userId);
}

let globals = { _, $, config };
_.extend(globalThis, globals);
