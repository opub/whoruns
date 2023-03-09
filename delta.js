const fs = require('fs');
const csv = require('csv-parser');
const snapshots = require('./snapshots.json');

const loaded = [];

fs.createReadStream('rundead.csv')
    .pipe(csv())
    .on('data', (data) => {
        for (let key in data) {
            if (key != 'wallet') {
                data[key] = parseInt(data[key]);
            }
        }
        if (data.bones >= 100) {
            loaded.push(data);
        }
    })
    .on('end', () => {
        snapshots[new Date().toISOString().slice(0, 16)] = loaded;
        fs.writeFileSync('snapshots.json', JSON.stringify(snapshots, null, 2));
    })
    .on('error', (error) => {
        console.error(error);
    });
