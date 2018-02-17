import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: ".env" });

import cc = require('../src/cryptocompare/cc');
import kraken = require('../src/kraken/kraken');

import {User} from '../src/models/User';
import {Order} from '../src/models/Order';

import stoplossbot = require('../src/tradingbot/stoplossbot');

var mongoose = require('mongoose');

//use q promises
global.Promise = require("q").Promise;
mongoose.Promise = global.Promise;

// wichtig hier eine extra Connection aufzubauen!!!

describe("Call stoploss", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL= 40000;
  mongoose.connect(process.env.MONGODBTEST_URI, function(err: any, dbcon: any) {
      if (err) {
          console.log('Unable to connect to the server. Please start the server. Error:', err);
          return;
      } else {
          console.log('Connected to Server successfully!');
      }
  });

  beforeAll(function(done){
    User.remove({}).exec().then(()=>{
      var newUser            = new User();
          newUser.email    = "test@gmail.com";
          newUser.name    = "Testuser";
          newUser.provider = 'local';
          newUser.password = newUser.generateHash("abcdef");
          return newUser.save();
    }).then((user: any)=>
    Order.remove({})
        .then(() => {
      //console.log(user);
    let i:number = 0;
    let mypromises: Promise<any>[] = new Array(10).fill(1).map((a)=>{
      const newTransaction =   {
           userref: 0,
           status: 'open',
           opentm: 1518110172.9204, //opentm = unix timestamp of when order was placed
           starttm: 0,
           expiretm: 0,
           descr: {
              pair: "ETHEUR",
              type: 'buy',
              ordertype: 'limit',
              price: 610.00,
              price2: 0,
              leverage: 'none',
              order: 'buy 0.20000000 ETHEUR @ limit 610.00',
              close: {ordertype: 'limit', price: 640.00} },
           vol: 0.20000000,
           vol_exec: 0.20000000,
           cost: '0.00000',
           fee: '0.00000',
           price: '610.00000',
           stopprice: 650.00+(i++*10),
           limitprice: '0.00000',
           misc: '',
           oflags: 'fciq'
         };

        var newOrder =   {
          user_id: user._id,
          txid : 'OTWMUX-AOBEV-QIEJD1',
          tx: newTransaction,
          stoploss: { observe: true, vol: 0.2}
        };
        return Order.create(newOrder);
      });
    return Promise.all(mypromises);
  })
  ).then (()=> done());
})

  it("cryptocompare getPrice", function(done) {
    spyOn(cc, 'getPrice').and.returnValue(new Promise((resolve, reject) =>{
      resolve({EUR: 100});
    }));

    cc.getPrice('ETH', 'EUR', 'CCAGG').then((data: any) => {
      const price = data;
      console.log(price);
    }).catch((err: any) => console.log(err))
    .then(()=> done());
  });

  it("stoplossServer: we have 10 Orders, 5 Orders is the stoploss price below market price 690", function(done) {
    Order.find().then((data: any)=>{
      // console.log(data);
      expect(data.length).toBe(10);
    })

    spyOn(cc, 'getPrice').and.returnValue(new Promise((resolve, reject) =>{
      resolve({EUR: 690});
    }));

    const txid = 'AAAAA-BBBBB-CCCCC'
    // we get fake SellOrder
    spyOn(kraken, 'placeOrder').and.returnValue(new Promise((resolve, reject) =>{
    //  resolve({txid: "O4ZG7N-4PGVD-FE6SCB"});
      resolve({txid: txid});
    }));

    let queryOrder = { 'AAAAA-BBBBB-CCCCC':
       {
         //refid: null,
         userref: 0,
         status: 'closed',
         //reason: null,
         opentm: 1518564799.4341,
         closetm: 1518564799.4487,
         starttm: 0,
         expiretm: 0,
         descr: {
            pair: "ETHEUR",
            type: 'sell',
            ordertype: 'market',
            price: 650.00,
            price2: 0,
            leverage: 'none',
            order: 'buy 0.20000000 ETHEUR @ limit 610.00',
            close: {}},
         vol: '0.20000000',
         vol_exec: '0.20000000',
         cost: '1.5',
         fee: '1.7',
         price: '650.0',
         stopprice: '0.00000',
         limitprice: '0.00000',
         misc: '',
         oflags: 'fciq' }
       };

    spyOn(kraken, 'queryOrders').and.returnValue(new Promise((resolve, reject) =>{
      resolve(queryOrder);
    }));

    // we excpect that for 5 Orders will be sellOrders
    stoplossbot.run().then((data: any[]) => {
      expect(data.length).toBe(10);
      //console.log(data);
      let filteredData = data.filter((n) => n!==undefined);
      expect(filteredData.length).toBe(6) // 5 sell and 1 update Order;

     // first ist just updating the stopprice
     expect(filteredData[0].txid).toBe("OTWMUX-AOBEV-QIEJD1");
     expect(filteredData[0].tx.descr.pair).toBe("ETHEUR");
     expect(filteredData[0].tx.price).toBe(610.00);
     expect(filteredData[0].tx.stopprice).toBe(676.2);

     expect(filteredData[1].txid).toBe("AAAAA-BBBBB-CCCCC");
     expect(filteredData[1].tx.descr.pair).toBe("ETHEUR");
     expect(filteredData[1].tx.price).toBe(650.00);

    }).catch((err: any) => {
      console.log(err)
    }).then(()=> done());

  });

  it("stoplossServer: watchOpenOrders from kraken", function(done) {
    // balance ETH : 1.3
    spyOn(kraken, 'getBalance').and.returnValue(new Promise((resolve, reject) =>{
      const balance = { ZEUR: '7934.6290',
        XXBT: '0.1000000000',
        XXRP: '0.00000223',
        XLTC: '0.0000000000',
        XXLM: '0.00000207',
        XETH: '1.3000000000' }
      resolve(balance);
    }));

    // we have Buy Transaction for EHTEUR
     // 1 buy 1.0 ETH
     // 1 buy 0.1 ETH
     // 1 buy 0.5 ETH sum = 1.6
     // 1 buy 0.4 ETH

     // we have Sell Orders Leveraged by 2
     // 1 sell 1 ETH
     // 1 sell 0.5 ETH

    spyOn(kraken, 'getClosedOrders').and.returnValue(new Promise((resolve, reject) =>{

    let closedOrders = { closed:
      {'AAAAA-BBBBB-CCCCC1':{
         //refid: null,
         userref: 0,
         status: 'closed',
         //reason: null,
         opentm: 1518564790.1000,
         closetm: 1518564799.4487,
         starttm: 0,
         expiretm: 0,
         descr: {
            pair: "ETHEUR",
            type: 'buy',
            ordertype: 'limit',
            price: 650.00,
            price2: 0,
            leverage: 'none',
            order: '',
            close: {}},
         vol: '1.00000000',
         vol_exec: '1.00000000',
         cost: '1.5',
         fee: '1.7',
         price: '650.0',
         stopprice: '0.00000',
         limitprice: '0.00000',
         misc: '',
         oflags: 'fciq' },
       'AAAAA-BBBBB-CCCCC2':{
          //refid: null,
          userref: 0,
          status: 'closed',
          //reason: null,
          opentm: 1518564780.2000,
          closetm: 1518564799.4487,
          starttm: 0,
          expiretm: 0,
          descr: {
             pair: "ETHEUR",
             type: 'buy',
             ordertype: 'limit',
             price: 680.00,
             price2: 0,
             leverage: 'none',
             order: '',
             close: {}},
          vol: '0.10000000',
          vol_exec: '0.10000000',
          cost: '1.5',
          fee: '1.7',
          price: '680.0',
          stopprice: '0.00000',
          limitprice: '0.00000',
          misc: '',
          oflags: 'fciq' },
        'AAAAA-BBBBB-CCCCC3':{
             //refid: null,
             userref: 0,
             status: 'closed',
             //reason: null,
             opentm: 1518564770.3000,
             closetm: 1518564799.4487,
             starttm: 0,
             expiretm: 0,
             descr: {
                pair: "ETHEUR",
                type: 'buy',
                ordertype: 'limit',
                price: 700.00,
                price2: 0,
                leverage: 'none',
                order: '',
                close: {}},
             vol: '0.50000000',
             vol_exec: '0.50000000',
             cost: '1.5',
             fee: '1.7',
             price: '700.0',
             stopprice: '0.00000',
             limitprice: '0.00000',
             misc: '',
             oflags: 'fciq' },
           'AAAAA-BBBBB-CCCCC4':{
                  //refid: null,
                  userref: 0,
                  status: 'closed',
                  //reason: null,
                  opentm: 1518564770.3000,
                  closetm: 1518564799.4487,
                  starttm: 0,
                  expiretm: 0,
                  descr: {
                     pair: "ETHEUR",
                     type: 'buy',
                     ordertype: 'limit',
                     price: 710.00,
                     price2: 0,
                     leverage: 'none',
                     order: '',
                     close: {}},
                  vol: '0.40000000',
                  vol_exec: '0.40000000',
                  cost: '1.5',
                  fee: '1.7',
                  price: '710.0',
                  stopprice: '0.00000',
                  limitprice: '0.00000',
                  misc: '',
                  oflags: 'fciq' }
        },
        count: 4
     };
     resolve(closedOrders);
    }));

    User.find({}).exec().then((user: any)=>
    stoplossbot.watchOpenOrders(user[0]._id).then((data: any[]) => {
      // there is no build flatMap (is still a proposal. Here is an implimentation)
      const flatMap = (f: any, arr: any[]) => arr.reduce((x, y) => [...x, ...f(y)], [])
      let dataFlat = flatMap(((x: any) =>x), data);

      // we expect to have 3 observe stoploss each with
      // 1 buy 1.0 EHT but stoploss only for vol 1
      // 1 buy 0.1 EHT but stoploss for vol 0.1
      // 1 buy 0.5 EHT but stoploss for vol 0.2 (because balance is only 1.3)
      // 1 buy 0.4 EHT but stoploss for vol 0 (because no balance)

      expect(dataFlat.length).toBe(4);
      expect(dataFlat[0].txid).toBe("AAAAA-BBBBB-CCCCC1");
      expect(dataFlat[0].stoploss.observe).toBe(true);
      expect(dataFlat[0].stoploss.vol).toBe(1);

      expect(dataFlat[1].txid).toBe("AAAAA-BBBBB-CCCCC2");
      expect(dataFlat[1].stoploss.observe).toBe(true);
      expect(dataFlat[1].stoploss.vol).toBe(0.1);

      expect(dataFlat[2].txid).toBe("AAAAA-BBBBB-CCCCC3");
      expect(dataFlat[2].stoploss.observe).toBe(true);
      expect(dataFlat[2].stoploss.vol).toBe(0.2);

      expect(dataFlat[3].txid).toBe("AAAAA-BBBBB-CCCCC4");
      expect(dataFlat[3].stoploss.observe).toBe(false);
      expect(dataFlat[3].stoploss.vol).toBe(0);
    })
    ).catch((err: any) => {
      console.log(err)
    }).then(()=> done());
  });

// when sell Order with Leveraged => queryPositions
});
