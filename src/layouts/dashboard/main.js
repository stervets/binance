import CentralBlock from 'components/central-block/main.vue';
import DashboardView from 'components/dashboard/main.vue';
import ButtonPanelView from 'components/buttonPanel/main.vue';
import { ref } from 'vue';

export default {
    components: {
        CentralBlock,
        DashboardView,
        ButtonPanelView
    },

    setup() {
        return {
            isReady: ref(false)
        };
    },

    async mounted() {
        this.isReady = true;
    },

    methods: {
        async alignWidgets() {
            await this.$refs.dash.alignWidgets();
            this.toggleAlignButton(true);
        },

        onWidgetsLoaded(widgets) {
            for (let id in widgets) {
                let widget = widgets[id];
                widget.type === 'binance' &&
                this.$refs.panel.moveToHidden(widget.data.coin);
            }
        },

        onAddNewWidget(value) {
            this.$refs.dash.addNewWidget(value);
        },

        onDeleteWidget(widget) {
            this.$refs.panel.moveToShown(widget.data.coin);
        },

        toggleAlignButton(isAlignButtonDisabled) {
            this.$refs.panel.isAlignButtonDisabled = isAlignButtonDisabled;
        }
    }
};
