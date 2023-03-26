export default {
    name : 'Dropdown',
    props: ['state', 'position'],

    computed: {
        revertedItems(){
            return _.invert(this.state.items);
        },

        sortedItems(){
            return Object.keys(this.revertedItems).sort();
        }
    },

    async mounted() {
        $('body').on('mouseup', this.closeDropdown);
    },

    unmounted() {
        $('body').off('mouseup', this.closeDropdown);
    },

    methods: {
        closeDropdown() {
            this.state.showDropdown = false;
        },

        select(value) {
            this.$emit('select', value);
        },
    },
};
