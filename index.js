const { loadNFTs } = require('./nft');
const { elapsed, log } = require('./common/util');
const fs = require('fs');

const MAGICEDEN = '1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix';
const jsonFile = 'rundead.json';
const csvFile = 'rundead.csv';
const holdingFile = 'holdings.csv';

(async () => {
    const started = Date.now();

    const nfts = await loadNFTs();
    exportJSON(nfts);

    exportHoldings(nfts, started);

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
        const info = wallets.has(nft.owner) ? wallets.get(nft.owner) : { wallet: nft.owner, rundead: 0, bones: 0, fastest: 0, slowest: Number.MAX_SAFE_INTEGER };
        info.rundead++;
        info.bones += nft.Bones && !isNaN(nft.Bones) ? parseInt(nft.Bones) : 0;
        const miles = nft.Miles && !isNaN(nft.Miles) ? parseInt(nft.Miles) : 0;
        if (miles > info.fastest) {
            info.fastest = miles;
        }
        if (miles < info.slowest) {
            info.slowest = miles;
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

function exportHoldings(nfts, started) {
    log('saving', nfts.length, 'holdings');
    nfts.sort((a, b) => sortHoldings(a, b));
    fs.writeFileSync(holdingFile, `wallet,rundead,mint,,last updated ${new Date(started).toISOString()}\n`);
    nfts.forEach(n => {
        let line = `${n.owner},${n.name},${n.mint}\n`;
        fs.appendFileSync(holdingFile, line);
    });
}

function sortHoldings(a, b) {
    if (a.owns !== b.owns) {
        return b.owns - a.owns;
    }
    if (a.owner !== b.owner) {
        return a.owner - b.owner;
    }
    return a.name - b.name;
}