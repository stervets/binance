export default {
    data() {
        return {
            messages: [
                { isClient: true, text: Math.random() + '-' + Math.random(), id: Math.random() },
                { isClient: false, text: Math.random() + '-' + Math.random(), id: Math.random() },
                { isClient: false, text: Math.random() + '-' + Math.random(), id: Math.random() },
                { isClient: true, text: Math.random() + '-' + Math.random(), id: Math.random() }
            ]
        };
    },

    methods: {
        addMessage(message) {
            this.messages.push(message);
            this.$nextTick(() => {
                this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
            });
        }
    }
};
