export class Binance {

    constructor(coin, handler) {
        let MAX_DATA_LENGTH = 20;
        this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${coin}usdt@trade`);

        let sendDataToHandler = _.throttle(handler, 500, {
                leading : false,
                trailing: true
            }),
            data              = [];

        this.ws.onmessage = (event) => {
            const parsedData = JSON.parse(event.data),
                  dataItem   = [parsedData.E, parseFloat(parsedData.p)]; // [time, price]

            data.push(dataItem);
            data.length > MAX_DATA_LENGTH && data.shift();
            data.length === MAX_DATA_LENGTH && sendDataToHandler(data);
        };
    }
}

