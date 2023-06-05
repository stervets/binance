import workerFile from './worker.js';
import { nextTick, ref } from 'vue';
import { initializeApp } from "firebase/app";
import { getDatabase, ref as dbReference, onValue, update, remove } from "firebase/database";
import WidgetView from 'components/widget/main.vue';

export default {
    components: {
        WidgetView
    },

    setup() {
        const worker = new Worker(
            URL.createObjectURL(new Blob([workerFile], { type: 'text/javascript' })),
        );

        const app        = initializeApp(config.firebase),
              db         = getDatabase(app),
              widgetsRef = dbReference(db, `/${config.userId}/widgets`);

        return {
            db,
            worker,
            widgetsRef,
            showGrid        : ref(false),
            showWidgets     : ref(false),
            state           : ref({
                tableWidth: 0,
                cellWidth : 0
            }),
            widgets         : ref({}),
            workerHandlers  : {},
            promises        : {},
            isInitialLoading: true
        };
    },

    created() {
        this.worker.onmessage = this.onWorkerMessage;
        this.registerWorkerHandler('moveWidgets', this.moveWidgets);
        onValue(this.widgetsRef, this.onDbRefValue);
    },

    mounted() {
        _.extend(this, {
            $$el  : $(this.$el),
            $grid : $(this.$refs.grid),
            $image: $(this.$refs.image)
        });

        $(window).resize(_.throttle(this.onResize, 100, {
            leading : false,
            trailing: true
        }));

        this.onResize();
        this.showWidgets = true;

        config.firstStart && (async () => {
            await this.addNewWidget('btc');
            await this.addNewWidget('eth');
            await this.addNewWidget('bnb');
            await this.addNewWidget('doge');
            await this.addNewWidget('ada');
            await this.addNewWidget('xrp');
        })();
    },

    methods: {
        pxToGrid(px) {
            return Math.round((px - 1) / this.state.cellWidth);
        },

        gridToPx(grid) {
            return Math.round(grid * this.state.cellWidth) + 1;
        },

        getWidgetView(id) {
            return this.$refs[`w_${id}`][0];
        },

        onDbRefValue(snapshot) {
            let widgets = snapshot.val();
            _.extend(this.widgets, widgets);

            if (this.isInitialLoading) {
                this.calculateTableHeight();
                this.correctHeight();
                this.$emit('widgetsLoaded', this.widgets);
                this.alignWidgets(true);
                this.isInitialLoading = false;
            } else {
                Object.keys(this.widgets).forEach((key) => {
                    if (!widgets[key]) {
                        delete this.widgets[key];
                    }
                });
            }
        },

        async onResize() {
            this.state.tableWidth = this.$$el.width();
            this.state.cellWidth  = this.state.tableWidth / config.TABLE_WIDTH;
            this.$grid.css('background-size', this.state.cellWidth);
            $(this.$refs.image).height(this.$el.scrollHeight);
            for(let id in this.widgets){
                let widget = this.getWidgetView(id);
                widget && widget.onResize();
                console.log(id, widget.onResize);
                await _.timeout(100);
            }
        },

        correctHeight() {
            let heightPx = this.gridToPx(this.tableHeight + 10);
            this.$grid.height(heightPx);
            this.$image.height(heightPx);
        },

        calculateTableHeight(widget) {
            let height            = 0,
                checkWidgetBottom = (widget) => {
                    let widgetBottom = widget.y + widget.h;
                    if (widgetBottom > height) {
                        height = widgetBottom;
                    }
                }

            for (let id in this.widgets) {
                checkWidgetBottom(this.widgets[id]);
            }

            widget && checkWidgetBottom(widget);

            return (this.tableHeight = height);
        },

        scrollToWidgetBottom(widget, noAdditionalHeight) {
            let widgetBottom = this.gridToPx(widget.y + widget.h),
                tableHeight  = this.$$el.height();
            if (widgetBottom > tableHeight + this.$el.scrollTop) {
                this.$el.scrollTop = widgetBottom - tableHeight +
                                     (noAdditionalHeight ? 0 : this.gridToPx(4));
            }
        },

        getCollision(widget) {
            let widgets = _.clone(this.widgets);
            delete widgets[widget.id];
            this.calculateTableHeight(widget);
            this.correctHeight();
            this.scrollToWidgetBottom(widget, true);
            return this.postMessage({
                com       : 'getCollision',
                widget,
                widgets   : _.values(widgets),
                tableWidth: config.TABLE_WIDTH
            });
        },

        async addNewWidget(value) {
            let w = 12, h = 8;
            if (value === 'help') {
                w *= 2;
                h *= 2;
            }
            let widget              = {
                id  : _.genId(),
                x   : Math.round(config.TABLE_WIDTH / 2 - w / 2),
                y   : -100,
                w,
                h,
                type: value === 'help' ? 'help' : 'binance',
                data: {
                    coin: value
                }
            };
            this.widgets[widget.id] = widget;
            await nextTick();
            let view          = this.getWidgetView(widget.id);
            view.movingWidget = _.pick(widget, 'id', 'x', 'y');
            await nextTick();
            await this.postMessage({
                com       : 'getFreePlace',
                widget,
                widgets   : _.values(this.widgets),
                tableWidth: config.TABLE_WIDTH
            });
            this.saveWidgets();
        },

        async alignWidgets(noSaveWidgets) {
            await this.postMessage({
                com       : 'arrangeWidgets',
                widgets   : _.values(this.widgets),
                tableWidth: config.TABLE_WIDTH
            });
            return this.saveWidgets(noSaveWidgets);
        },

        moveWidgets(data) {
            data.widgets && data.widgets.forEach((widget) => {
                this.getWidgetView(widget.id).movingWidget = {
                    x: widget.x,
                    y: widget.y
                };
            });
            this.tableHeight = data.tableHeight;
        },

        saveWidgets(noSaveWidgets) {
            let data = Object.keys(this.widgets).reduce((res, id) => {
                let view           = this.getWidgetView(id),
                    originalWidget = _.pick(view.widget, 'x', 'y', 'w', 'h'),
                    movingWidget   = _.pick(view.movingWidget, 'x', 'y', 'w', 'h');

                movingWidget = _.defaults(movingWidget, originalWidget);

                if (!_.isEqual(originalWidget, movingWidget)) {
                    if (!noSaveWidgets) {
                        _.extend(view.widget, movingWidget);
                        view.movingWidget.id && this.scrollToWidgetBottom(movingWidget);
                    }

                    res[id]           = view.widget;
                    view.movingWidget = {};
                }

                return res;
            }, {});

            let isEmptyData = _.isEmpty(data);
            this.$emit('toggleAlignButton', isEmptyData);

            if (!isEmptyData && !noSaveWidgets) {
                this.correctHeight();
                return update(this.widgetsRef, data);
            }
        },

        deleteWidget(id) {
            this.$emit('deleteWidget', this.widgets[id]);
            delete this.widgets[id];
            this.$emit('toggleAlignButton', false);
            return remove(dbReference(this.db, `/${config.userId}/widgets/${id}`));
        },

        registerWorkerHandler(command, handler) {
            !this.workerHandlers[command] && (this.workerHandlers[command] = []);
            this.workerHandlers[command].push(handler);
        },

        postMessage(message) {
            let deferId = _.genId();
            return new Promise((resolve, reject) => {
                this.promises[deferId] = { resolve, reject };
                this.worker.postMessage(_.deepClone(_.extend(message, { deferId })));
            });
        },

        onWorkerMessage(e) {
            let data = e.data

            this.workerHandlers[data.com] && this.workerHandlers[data.com].forEach((handler) => {
                handler(data);
            });

            let promise = this.promises[data.deferId];
            promise && (data.error ? promise.reject(data) : promise.resolve(data));
            delete this.promises[data.deferId];
        }
    }
};
