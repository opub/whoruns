const { get, requestError } = require('./common/util');

const collection = 'rundead';
const magicEden = 'https://api-mainnet.magiceden.dev/v2';

// get current MagicEden wallet holdings
exports.loadWallet = async function (wallet) {
    const nfts = [];
    const limit = 500;
    let loading = true;
    let offset = 0;
    do {
        try {
            const url = `${magicEden}/wallets/${wallet}/tokens?listStatus=both&offset=${offset}&limit=${limit}`;
            const { data } = await get(url);
            loading = (data && data.length == limit);
            offset += limit;
            nfts.push(...(data.filter(nft => nft.collection === collection)));
        }
        catch (e) {
            loading = await requestError('loadWallet', e);
        }
    }
    while (loading)
    return nfts;
}

// get MagicEden token metadata
exports.loadToken = async function (mint) {
    if (!mint) {
        return false;
    }
    let loading = true;
    do {
        try {
            const url = `${magicEden}/tokens/${mint}`;
            const { data } = await get(url);
            return data;
        }
        catch (e) {
            loading = await requestError('loadToken', e);
        }
    }
    while (loading)
}
