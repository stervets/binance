export default {
    name: 'InputView',
    data() {
        return {
            message: '',
        };
    },
    methods: {
        sendMessage() {
            this.$emit('message', this.message);
            this.message = '';
        },
    },
};
