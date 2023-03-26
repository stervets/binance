import CentralBlock from 'components/central-block/main.vue';
import InputView from 'components/input/main.vue';
import DashboardView from 'components/dashboard/main.vue';
import ButtonPanelView from 'components/buttonPanel/main.vue';
import NLP from 'classes/nlp';
import { ref } from 'vue';

export default {
    components: {
        CentralBlock,
        InputView,
        DashboardView,
        ButtonPanelView
    },

    setup() {
        return {
            nlp    : new NLP(),
            isReady: ref(false)
        };
    },

    async mounted() {
        await this.nlp.loadModel();
        this.isReady = true;
    },

    methods: {
        async onMessage(text) {
            console.log(text);
        },

        async alignWidgets() {
            this.$refs.dash.alignWidgets();
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

        disableAlignButton(isAlignButtonDisabled) {
            this.$refs.panel.isAlignButtonDisabled = isAlignButtonDisabled;
        }
    }
};
