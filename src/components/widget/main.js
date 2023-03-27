import { ref, nextTick } from 'vue';
import WidgetBinance from './binance/main.vue';
import WidgetHelp from './help/main.vue';

export default {
    props: ['dashboard', 'widget'],

    setup(data) {
        return {
            title       : ref(''),
            movingWidget: ref({}),
            isClosing   : ref(false),
            isOpened    : ref(false),
            movingTip   : ref(''),
            resizing    : ref(false),
            content     : data.widget.type === 'help' ? WidgetHelp : WidgetBinance
        };
    },

    computed: {
        left() {
            return this.getPxCoordinate('left', 'x');
        },

        top() {
            return this.getPxCoordinate('top', 'y');
        },

        width() {
            return this.getPxCoordinate('width', 'w');
        },

        height() {
            return this.getPxCoordinate('height', 'h');
        }
    },

    async mounted() {
        _.extend(this, {
            $$el   : $(this.$el),
            $title : $(this.$refs.widgetTitle),
            $resize: $(this.$refs.resize),
            $tip   : $(this.$refs.tip),
            $body  : $('body')
        });

        this.$title.on('mousedown', e => this.onMouseDown(e, this.onTitleMouseMove));
        this.$resize.on('mousedown', e => this.onMouseDown(e, this.onResizeMouseMove));

        await _.timeout(300);
        this.isOpened = true;
    },

    methods: {
        getPxCoordinate(propCSS, gridCoord) {
            return this.movingWidget[propCSS] == null ?
                   this.dashboard.gridToPx(this.movingWidget[gridCoord] == null ?
                                           this.widget[gridCoord] :
                                           this.movingWidget[gridCoord]) :
                   this.movingWidget[propCSS];
        },

        onMouseDown(e, onMouseMove) {
            this.resizing = onMouseMove === this.onResizeMouseMove;
            let tipLeft   = e.offsetX - 30;
            tipLeft < 0 && (tipLeft = 0);
            !this.resizing && this.$tip.css('left', tipLeft);

            _.extend(this.movingWidget, {
                    startX     : e.pageX,
                    startY     : e.pageY,
                    startLeft  : this.left,
                    startTop   : this.top,
                    startWidth : this.width,
                    startHeight: this.height,
                    maxLeft    : this.dashboard.state.tableWidth - this.width,
                    maxWidth   : this.dashboard.state.tableWidth - this.left + 2,
                    minWidth   : config.MIN_WIDGET_WIDTH * this.dashboard.state.cellWidth,
                    minHeight  : config.MIN_WIDGET_HEIGHT * this.dashboard.state.cellWidth
                },
                _.pick(this.widget, 'id', 'x', 'y', 'w', 'h'),
                _.pick(this, 'left', 'top', 'width', 'height'));

            this.$body.on('mousemove', (this.onMouseMove = onMouseMove));
            this.$body.on('mouseup', this.onMouseUp);
            this.dashboard.showGrid = true;
        },

        onTitleMouseMove(e) {
            let left = e.pageX - this.movingWidget.startX + this.movingWidget.startLeft,
                top  = e.pageY - this.movingWidget.startY + this.movingWidget.startTop;

            (left < 0) && (left = 0);
            (top < 0) && (top = 0);
            (left > this.movingWidget.maxLeft) && (left = this.movingWidget.maxLeft);

            let x            = this.dashboard.pxToGrid(left),
                y            = this.dashboard.pxToGrid(top),
                getCollision = !(x === this.movingWidget.x && y === this.movingWidget.y);

            _.extend(this.movingWidget, { x, y, left, top });
            this.movingTip = `${x}:${y}`;
            getCollision && this.$emit('getCollision', this.movingWidget);
        },

        onResizeMouseMove(e) {
            let width  = e.pageX - this.movingWidget.startX + this.movingWidget.startWidth,
                height = e.pageY - this.movingWidget.startY + this.movingWidget.startHeight;

            (width < this.movingWidget.minWidth) && (width = this.movingWidget.minWidth);
            (height < this.movingWidget.minHeight) && (height = this.movingWidget.minHeight);
            (width > this.movingWidget.maxWidth) && (width = this.movingWidget.maxWidth);

            let w            = this.dashboard.pxToGrid(width),
                h            = this.dashboard.pxToGrid(height),
                getCollision = !(w === this.movingWidget.w && h === this.movingWidget.h);

            _.extend(this.movingWidget, { w, h, width, height });
            this.movingTip = `${w}x${h}`;
            getCollision && this.$emit('getCollision', this.movingWidget);
        },

        onMouseUp() {
            this.$body.off('mousemove', this.onMouseMove);
            this.$body.off('mouseup', this.onMouseUp);
            this.dashboard.showGrid = false;
            this.$emit('saveWidgets');
            this.forceMoveToOwnPlace();
        },

        onResize() {
            this.$refs.widgetContent.onResize && this.$refs.widgetContent.onResize();
        },

        async forceMoveToOwnPlace() {
            this.movingWidget = _.pick(this.widget, 'x', 'y', 'w', 'h');
            await nextTick();
            this.movingWidget = {};
            await _.timeout(300);
            this.onResize();
            this.resizing = false;
        },

        async onClose() {
            this.isClosing = true;
            await _.timeout(300);
            this.$emit('deleteWidget', this.widget.id);
        }
    }
};
