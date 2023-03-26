import CentralBlock from 'components/central-block/main.vue';
import InputView from 'components/input/main.vue';
import ChatView from 'components/chat/main.vue';
import NLP from 'classes/nlp';
import { ref } from 'vue';

export default {
    components: {
        CentralBlock,
        InputView,
        ChatView
    },

    setup() {
        return {
            nlp: new NLP(),
            isReady: ref(false)
        };
    },

    async mounted() {
        await this.nlp.loadModel();
        this.isReady = true;
    },

    methods: {
        async onMessage(text) {
            this.$refs.chat.addMessage({
                id      : _.genId(),
                isClient: true,
                text
            });

            let res = await this.nlp.process(text);
            console.log(res);
            this.$refs.chat.addMessage({
                id      : _.genId(),
                isClient: false,
                text: res.intent
            });
        }
    }
};
