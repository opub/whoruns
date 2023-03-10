const { loadNFTs } = require('./nft');
const { elapsed, log } = require('./common/util');
const fs = require('fs');

const MAGICEDEN = '1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix';
const jsonFile = 'rundead.json';
const csvFile = 'rundead.csv';

(async () => {
    const started = Date.now();

    const nfts = await loadNFTs();
    exportJSON(nfts);

    const wallets = rankWallets(nfts);
    exportCSV(wallets, started);

    log('completed', elapsed(Date.now() - started));
})();

function exportJSON(nfts) {
    const len = nfts.length;
    log('saving', len, 'nfts');
    fs.writeFileSync(jsonFile, '[\n');
    for (let i = 0; i < len; i++) {
        fs.appendFileSync(jsonFile, JSON.stringify(nfts[i], null, 2));
        if (i < len - 1) {
            fs.appendFileSync(jsonFile, ',\n');
        }
    }
    fs.appendFileSync(jsonFile, '\n]');
}

function rankWallets(nfts) {
    const wallets = new Map();
    nfts.forEach(nft => {
        const info = wallets.has(nft.owner) ? wallets.get(nft.owner) : { wallet: nft.owner, rundead: 0, bones: 0, fastest: 0 };
        info.rundead++;
        if (!isNaN(nft.Bones)) {
            info.bones += parseInt(nft.Bones);
        }
        if (!isNaN(nft.Miles) && parseInt(nft.Miles) > info.fastest) {
            info.fastest = parseInt(nft.Miles);
        }
        if (!isNaN(nft.Miles) && (!info.slowest || parseInt(nft.Miles) < info.slowest)) {
            info.slowest = parseInt(nft.Miles);
        }
        wallets.set(nft.owner, info);
    });
    return Array.from(wallets.values()).sort((a, b) => sortWallets(a, b));
}

function sortWallets(a, b) {
    if (a.bones !== b.bones) {
        return b.bones - a.bones;
    }
    if (a.rundead !== b.rundead) {
        return b.rundead - a.rundead;
    }
    return b.fastest - a.fastest;
}

function exportCSV(wallets, started) {
    log('saving', wallets.length, 'wallets');
    fs.writeFileSync(csvFile, `rank,wallet,rundead,bones,fastest,slowest,,last updated ${new Date(started).toISOString()}\n`);
    let rank = 1;
    wallets.forEach(w => {
        let wallet = w.wallet === MAGICEDEN ? 'magiceden' : w.wallet;
        let line = `${rank++},${wallet},${w.rundead},${w.bones},${w.fastest},${w.slowest}\n`;
        fs.appendFileSync(csvFile, line);
    });
}