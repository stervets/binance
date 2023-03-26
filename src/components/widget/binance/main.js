import { ref } from 'vue';
import * as Highcharts from 'highcharts';
import moment from 'moment';

export default {
    props: ['widgetView'],
    setup(data) {
        return {
            widget         : data.widgetView.widget,
            chart          : null,
            ws             : null,
            isLoading      : ref(true),
            isLoaded       : ref(false),
            extremumPadding: 1,
            chartMin       : 0,
            chartMax       : 0,
            lastPrice      : 0
        }
    },

    created() {
        this.widgetView.title = config.coins[this.widget.data.coin] + ':';
    },

    mounted() {
        this.chart = Highcharts.chart(this.$refs.chartView, {
            plotOptions: {
                series: {
                    marker: {
                        enabled: false
                    }
                }
            },
            chart      : {
                backgroundColor: '#202123',
                spacing        : [5, 5, 5, 5],
                animation      : false
            },
            title      : {
                text: null
            },

            xAxis: {
                type         : 'linear',
                labels       : {
                    rotation : 0,
                    formatter: function () {
                        return moment(this.value).format('HH:mm:ss');
                    }
                },
                gridLineColor: '#444653',
                tickWidth    : 1
            },

            yAxis : {
                title        : {
                    text: null // убираем заголовок
                },
                labels       : {
                    formatter: function () {
                        return this.value.toFixed(2) + '$';
                    }
                },
                gridLineColor: '#444653'
            },
            series: [{
                name   : 'Price',
                data   : this.data,
                color  : this.genColor(this.widget.data.coin),
                tooltip: {
                    pointFormatter: function () {
                        return `USDT Price: ${this.y.toFixed(2)}$`;
                    }
                }
            }],
            legend: {
                enabled: false
            }
        });

        $(this.$el).find('.highcharts-credits').hide();
        this.ws           = new WebSocket(`wss://stream.binance.com:9443/ws/${this.widget.data.coin}usdt@trade`);
        this.ws.onmessage = this.onWebsocketMessage;
    },

    unmounted() {
        clearTimeout(this.updateChartTimer);
        this.ws.close();
    },

    methods: {
        getCeilTime() {
            return Math.ceil(Date.now() / 1000) * 1000;
        },

        updateChart() {
            this.chart.series[0].addPoint([this.getCeilTime(), this.lastPrice]);
            this.chart.series[0].removePoint(0);
            this.widgetView.title = `${config.coins[this.widget.data.coin]}: <span class="price">${this.lastPrice.toFixed(2)}$</span>`;
            this.updateChartTimer = setTimeout(this.updateChart, 1000);
        },

        async onWebsocketMessage(event) {
            const parsedData = JSON.parse(event.data),
                  price      = parseFloat(parsedData.p);

            if (this.isLoaded) {
                this.lastPrice = price;
            } else {
                let time    = this.getCeilTime(),
                    data    = [];
                data.length = config.MAX_DATA_LENGTH;
                data.fill([time, price]);
                data = data.map((item, index) => {
                    return [item[0] - ((config.MAX_DATA_LENGTH - index) * 1000), item[1]];
                });

                this.isLoaded = true;
                this.chart.series[0].setData(data.slice());

                await _.timeout(300);
                this.isLoading = false;
                await _.timeout(700);
                this.updateChart();
            }
        },

        onResize() {
            this.chart.reflow();
        },

        genColor(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = Math.floor(Math.abs((Math.sin(hash) * 10000) % 1 * 16777216)).toString(16);
            return '#' + '0'.repeat(6 - color.length) + color;
        }
    }
};
