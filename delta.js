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
        const now = new Date().toISOString().slice(0, 16);
        snapshots[now] = loaded;
        fs.writeFileSync('snapshots.json', JSON.stringify(snapshots, null, 2));
        updateMovers(now);
    })
    .on('error', (error) => {
        console.error(error);
    });

function updateMovers(now) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const cutoff = yesterday.toISOString().slice(0, 16);

    let then;
    for (let key in snapshots) {
        if (!then || key <= cutoff) {
            then = key;
        }
    }

    const movers = [];
    const lookup = new Map(snapshots[then].map(x => [x.wallet, x]));

    for (let check of snapshots[now]) {
        const found = lookup.get(check.wallet);
        if (found && check.bones !== found.bones) {
            check.change = check.bones - found.bones;
            movers.push(check);
        }
    }
    movers.sort((a, b) => b.change - a.change);

    const top = movers.filter(w => w.change > 0).slice(0, 20);
    console.log(`rank,wallet,bones,added,,last updated ${new Date().toISOString()}`);
    top.forEach(wallet => {
        console.log(`${wallet.rank},${wallet.wallet},${wallet.bones},${wallet.change}`);
    });
    console.log();

    movers.sort((a, b) => a.change - b.change);

    const bottom = movers.filter(w => w.change < 0).slice(0, 20);
    console.log('rank,wallet,bones,removed');
    bottom.forEach(wallet => {
        console.log(`${wallet.rank},${wallet.wallet},${wallet.bones},${wallet.change}`);
    });
}