import { containerBootstrap } from '@nlpjs/core';
import { Nlp } from '@nlpjs/nlp';
import model from 'model.json';
import { LangRu } from '@nlpjs/lang-ru';

export default class NLP extends BaseClass {
    data() {
        return {
            //manager: new NlpManager({ languages: ['ru'] })
        };
    }

    async loadModel() {
        // this.manager = new Nlp({ languages: ['ru'] });
        // this.manager.import(model);
        // console.log(this.manager);
        // return;
        const container = await containerBootstrap({ languages: ['ru'] });
        container.use(Nlp);
        container.use(LangRu);
        this.manager = container.get('nlp');
        this.manager.import(model);
        //console.log(1, this.manager);
        //return this.manager.load('../model.nlp');
    }

    process(text) {
        return this.manager.process(text);
    }

    constructor() {
        super();
    }
}
