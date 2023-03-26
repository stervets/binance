export default class BaseClass {
    constructor() {
        if (typeof this.data === 'function'){
            _.extend(this, this.data());
        }
    }
}
