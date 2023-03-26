/*
 ETHUSDT@trade: Ethereum / USDT
 BNBUSDT@trade: Binance Coin / USDT
 ADAUSDT@trade: Cardano / USDT
 DOGEUSDT@trade: Dogecoin / USDT
 XRPUSDT@trade: XRP / USDT
 DOTUSDT@trade: Polkadot / USDT
 SOLUSDT@trade: Solana / USDT
 LINKUSDT@trade: Chainlink / USDT
 UNIUSDT@trade: Uniswap / USDT
 MATICUSDT@trade: Polygon / USDT
 SUREUSDT@trade: SureRemit / USDT
 */

export default class Binance extends BaseClass {
    data() {
        return {
            channels: {},
            handlers: []
        };
    }

    subscribe(currency, handler) {
        if (this.channels[currency]) {
            handler(this.channels[currency].data);
        } else {
            const ws     = new WebSocket(`wss://stream.binance.com:9443/ws/${currency}usdt@trade`);
            let channel  = this.channels[currency] = {
                ws,
                handlers: [],
                data    : []
            };

            let sendDataToChannel = _.throttle(()=>{
                channel.handlers.forEach((handler) => handler(channel.data));
            }, 500, {
                leading: false,
                trailing: true
            })

            ws.onmessage = (event) => {
                const parsedData = JSON.parse(event.data),
                      data       = {
                          time : parsedData.E,
                          price: parsedData.p
                      };
                channel.data.push(data);
                channel.data.length > 100 && channel.data.shift();
                sendDataToChannel();
            };
        }
        this.channels[currency].handlers.push(handler);
    }

    unsubscribe(handler) {
        Object.keys(this.channels).forEach((name) => {
            let handlers = this.channels[name].handlers;
            handlers.splice(handler.indexOf(handler), 1);
            if (!handlers.length) {
                this.channels[name].ws.close();
                delete this.channels[name];
            }
        });
    }

    constructor() {
        super();
    }
}

