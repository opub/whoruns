const fs = require('fs');
const { loadWallet, loadToken } = require('./api');
const { increment, progress, clear, log, elapsed } = require('./common/util');

const magiceden = '1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix';
const hashList = require('./data/hash-list.json');
const cacheFile = 'rundead.json';

// load all nfts and metadata using locally cached values if available
exports.loadNFTs = async function () {
    let started = Date.now();

    const cached = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf-8')) : [];
    const lookup = new Map(cached.map(nft => [nft.mint, nft]));
    hashList.forEach(hash => {
        if (!lookup.has(hash)) {
            lookup.set(hash, {});
        }
    });

    const nfts = [];
    const wallets = [...new Set(cached.filter(nft => nft.owns > 1).map(nft => nft.owner))];
    for (let i = 0; i < wallets.length; i++) {
        const loaded = await loadWallet(wallets[i]);
        for (let j = 0; j < loaded.length; j++) {
            const nft = normalize(loaded[j]);
            nfts.push(nft);
            lookup.delete(nft.mint);
        }
        progress(i / wallets.length, 'wallets');
    }
    clear();
    console.log('wallets', wallets.length, 'rundead', nfts.length, elapsed(Date.now() - started));

    started = Date.now();
    const remaining = Array.from(lookup.keys());
    for (let i = 0; i < remaining.length; i++) {
        const loaded = await loadToken(remaining[i]);
        if (loaded) {
            const nft = normalize(loaded);
            nfts.push(nft);
            lookup.delete(nft.mint);
            progress(i / remaining.length, 'remaining');
        }
    }
    clear();
    console.log('tokens', remaining.length, 'rundead', nfts.length, elapsed(Date.now() - started));

    await countOwners(nfts);

    return nfts;
}

function normalize(nft) {
    const attributes = flatten(nft.attributes);
    return {
        mint: nft.mintAddress,
        name: nft.name,
        image: nft.image,
        owner: nft.owner,
        ...attributes
    };
}

function flatten(attributes) {
    if (attributes && attributes.length) {
        const attrs = [];
        for (const trait of attributes) {
            attrs[trait.trait_type] = trait.value;
        }
        return attrs;
    }
}

// get number owned
function countOwners(nfts) {
    log('counting owners');
    const owned = new Map();
    nfts.forEach(nft => {
        const owner = nft.owner;
        if (owner) {
            let ownerAlt;
            if (owner === magiceden) {
                ownerAlt = 'listed';
            }
            nft.ownerAlt = ownerAlt;
        }
        if (owner) {
            increment(owned, owner);
        }
    });
    nfts.forEach(nft => { nft.owns = owned.has(nft.owner) ? owned.get(nft.owner) : nft.owns });
}