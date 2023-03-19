const { get, requestError } = require('./common/util');
const rundead = require('./rundead.json');

const collection = 'rundead';
const magicEden = 'https://api-mainnet.magiceden.dev/v2';

async function getListings() {
    const nfts = [];
    const limit = 20;
    let loading = true;
    let offset = 0;
    do {
        try {
            const url = `${magicEden}/collections/${collection}/listings?offset=${offset}&limit=${limit}`;
            const { data } = await get(url);
            loading = (data && data.length == limit);
            offset += limit;
            nfts.push(...(data.map(nft => ({ mint: nft.tokenMint, price: nft.price }))));
        }
        catch (e) {
            loading = await requestError('getListings', e);
        }
    }
    while (loading)
    return nfts;
}

(async () => {
    const lookup = new Map(rundead.map(nft => [nft.mint, nft]));

    const listings = await getListings();
    listings.forEach(nft => {
        const found = lookup.get(nft.mint);
        if (found) {
            nft.listing = `https://magiceden.io/item-details/${nft.mint}`;
            nft.bones = parseInt(found.Bones);
            nft.b2s = parseInt(found.Bones) / nft.price;
            nft.s2b = nft.price / parseInt(found.Bones);
            delete nft.mint;
        }
    });

    const top = listings.sort((a, b) => b.b2s - a.b2s).slice(0, 20);
    top.forEach(nft => {
        console.log(nft.listing, '=', nft.bones, 'Bones,', parseFloat(nft.b2s.toFixed(3)), 'Bones/SOL,', parseFloat(nft.s2b.toFixed(3)), 'SOL/Bones,', nft.price, 'SOL');
    });
})();
