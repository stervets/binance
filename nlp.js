const { NlpManager } = require('node-nlp');
const fs = require('fs');

const corpus = fs.readFileSync('./corpus.json', 'utf8');
const data = JSON.parse(corpus);

const manager = new NlpManager({ languages: ['ru'] });

manager.addNamedEntityText('currency', 'currency', 'ru', ['EUR', 'USD'])
data.forEach(item => {
    item.sentences.forEach((text)=>{
        manager.addDocument('ru', text, item.command);
    });
});
//manager.addNamedEntityText('date', 'myDate', ['ru'], ['1', '2']);
//manager.addDocument('ru', 'get [myDate]?', 'getWeather');



(async() => {
    await manager.train();
    manager.save('./src/model.json');
})();
