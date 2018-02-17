import fetch from  'node-fetch';

const histo = (fromSymbol: string, toSymbol: string, limit: number = 3, aggregate: number = 1, period: string = 'minute') => new Promise((resolve, reject) => {
  fetch(`${process.env.CCApiURL}histo${period}?fsym=${fromSymbol}&tsym=${toSymbol}&limit=${limit}&aggregate=${aggregate}&e=Poloniex`)
    .then(response => resolve(response.json()))
    .catch((error) => {
      console.log('Cryptocompare API not available.');
      reject(`Cryptocompare API not available.Error: ${error}`);
    });
});

const getPrice = (fromSymbol: string, toSymbol: string, exchange?: string) => new Promise((resolve, reject) => {
    fetch(`${process.env.CCApiURL}price?fsym=${fromSymbol}&tsyms=${toSymbol}`)
        .then(response => resolve(response.json()))
        .catch(error => reject(error));
});

export = {
  histo,
  getPrice
};
