import Dropdown from 'components/dropdown/main.vue';
import { ref, reactive, shallowRef, shallowReactive } from 'vue';

export default {
    name      : 'ButtonPanel',
    components: {
        Dropdown,
    },

    setup() {
        return {
            state: ref({
                showDropdown: false,
                items       : _.clone(config.coins),
                hidden      : {}
            }),

            dropdownPosition: {
                left: 0,
                top : 0,
            },

            isAlignButtonDisabled: ref(false)
        };
    },

    computed: {
        isAddButtonDisabled() {
            return _.isEmpty(this.state.items);
        }
    },

    mounted() {
        this.$addButton = $(this.$refs.addButton);
    },

    methods: {
        moveToHidden(value) {
            if (this.state.items[value]) {
                this.state.hidden[value] = this.state.items[value];
                delete this.state.items[value];
            }
        },

        moveToShown(value) {
            if (this.state.hidden[value]) {
                this.state.items[value] = this.state.hidden[value];
                delete this.state.hidden[value];
            }
        },

        showDropdown() {
            let position = this.$addButton.position();
            _.extend(this.dropdownPosition, {
                left: position.left,
                top : position.top + this.$addButton.outerHeight()
            });
            this.state.showDropdown = true;
        },

        addNewWidget(value) {
            if (this.isAddButtonDisabled) return;
            this.moveToHidden(value);
            this.$emit('addNewWidget', value);
        },

        alignWidgets() {
            this.$emit('alignWidgets');
        }
    }
};
