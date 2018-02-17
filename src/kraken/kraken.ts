import KrakenClient = require('./krakenclient');

const pairsEUR = ['XBTEUR','ETHEUR','BCHEUR', 'DASHEUR', 'ETCEUR','LTCEUR','REPEUR','XMREUR','XRPEUR']
const pairsEHT = ['ICNETH', 'REPETH']

const kraken = new KrakenClient(process.env.APIKey, process.env.APISign, process.env.Timeout*1000 || 10000 );

const getBalance = () => {
  return new Promise((resolve, reject) => {
    kraken.api('Balance', {}, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

const getTradeBalance = () => {
  let aclass = 'currency';
  let asset = 'ZEUR';
  const options = {
    aclass,
    asset
  };

  return new Promise((resolve, reject) => {
    kraken.api('TradeBalance', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

/** return 
{ refid: null,
  userref: 0,
  status: 'open',
  opentm: 1518110172.9204,
  starttm: 0,
  expiretm: 0,
  descr:
   { pair: 'ETHEUR',
     type: 'buy',
     ordertype: 'limit',
     price: '610.00',
     price2: '0',
     leverage: 'none',
     order: 'buy 0.20000000 ETHEUR @ limit 610.00',
     close: '' },
  vol: '0.20000000',
  vol_exec: '0.00000000',
  cost: '0.00000',
  fee: '0.00000',
  price: '0.00000',
  stopprice: '0.00000',
  limitprice: '0.00000',
  misc: '',
  oflags: 'fciq' }
 }*/
const queryOrders = (txid?: any) => {
  return new Promise((resolve, reject) => {
    const options = {
      txid
    }
    kraken.api('QueryOrders', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};


/**
trades = whether or not to include trades in output (optional.  default = false)
userref = restrict results to given user reference id (optional)

return List:
 'OLMEXH-RG3ZW-6WRJN4':
  { refid: null,
    userref: 0,
    status: 'open',
    opentm: 1518443121.5636,
    starttm: 0,
    expiretm: 0,
    descr: [Object],
    vol: '0.20000000',
    vol_exec: '0.00000000',
    cost: '0.00000',
    fee: '0.00000',
    price: '0.00000',
    stopprice: '0.00000',
    limitprice: '0.00000',
    misc: '',
    oflags: 'fciq' } } }
*/

const getOpenOrders = (trades: boolean = false, userref?:string) => {
  return new Promise((resolve, reject) => {
    const options = {
      trades,
      userref
    }
    kraken.api('OpenOrders', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

/*
trades = whether or not to include trades in output (optional.  default = false)
userref = restrict results to given user reference id (optional)
start = starting unix timestamp or order tx id of results (optional.  exclusive)
end = ending unix timestamp or order tx id of results (optional.  inclusive)
ofs = result offset
closetime = which time to use (optional)
    open
    close
    both (default)
*/
const getClosedOrders = (ofs: number, starttm?: number, endtm?: number, trades: boolean = false, userref?:string, closetime: string="both") => {
  return new Promise((resolve, reject) => {
    const options = {
      trades,
      userref,
      start : starttm,
      end: endtm,
      ofs,
      closetime
    }
    kraken.api('ClosedOrders', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};


const getOpenPositions = (txid?: string, docalcs?: any ) => {
  return new Promise((resolve, reject) => {
    const options = {
      //txid,
      docalcs
    }
    kraken.api('OpenPositions', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

/**
pair = asset pair to get spread data for
since = return spread data since given id (optional.  inclusive)
*/
const getSpread = (pair: string , since: string ) => {
  return new Promise((resolve, reject) => {
    const options = {
      pair,
      since
    }
    kraken.api('Spread', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

/*
info = info to retrieve (optional):
    info = all info (default)
    leverage = leverage info
    fees = fees schedule
    margin = margin info
pair = comma delimited list of asset pairs to get info on (optional.  default = all)
*/
const getAssetPairs = (info: string, pair: string) => {
  return new Promise((resolve, reject) => {
    const options = {
      info,
      pair
    }
    kraken.api('AssetPairs', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

/**
pair = asset pair
type = type of order (buy/sell)
ordertype = order type:
    market
    limit (price = limit price)
    settle-position
price = price (optional.  dependent upon ordertype)
price2 = secondary price (optional.  dependent upon ordertype)
volume = order volume in lots
leverage = amount of leverage desired (optional.  default = none)
oflags = comma delimited list of order flags (optional):
    viqc = volume in quote currency (not available for leveraged orders)
    fcib = prefer fee in base currency
    fciq = prefer fee in quote currency
    nompp = no market price protection
    post = post only order (available when ordertype = limit)
starttm = scheduled start time (optional):
    0 = now (default)
    +<n> = schedule start time <n> seconds from now
    <n> = unix timestamp of start time
expiretm = expiration time (optional):
    0 = no expiration (default)
    +<n> = expire <n> seconds from now
    <n> = unix timestamp of expiration time
userref = user reference id.  32-bit signed number.  (optional)
validate = validate inputs only.  do not submit order (optional)

optional closing order to add to system when order gets filled:
    close[ordertype] = order type
    close[price] = price
    close[price2] = secondary price
    close: {
      ordertype: 'limit',
      price: 0.2
    }
    by "buy"-order the limit must be > the buying price: sell when hit target
    there is no stop-loss!
*/
const placeOrder = (pair: string, type: string, ordertype: string, price: Number, volume: Number, validate?: string, leverage?: Number) => {
  return new Promise((resolve, reject) => {
    const options = {
      pair,
      type,
      ordertype,
      price,
      volume,
      validate,
      leverage,
      trading_agreement: 'agree'
    }

    if (validate!=null && validate != ''){
      options.validate = validate;
    }
    if (leverage!=null){
      options.leverage = leverage;
    }
    kraken.api('AddOrder', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });
  });
};

export = {
  pairsEUR,
  pairsEHT,

  getBalance,
  getTradeBalance,
  placeOrder,
  getOpenPositions,
  getSpread,
  getAssetPairs,
  getOpenOrders,
  queryOrders,
  getClosedOrders
};
