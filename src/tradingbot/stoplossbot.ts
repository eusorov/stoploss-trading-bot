//const config = require('../config');
import cc = require('../cryptocompare/cc');
import kraken = require('../kraken/kraken');

import {User} from '../models/User';
import {Order, IOrderModel} from '../models/Order';

import * as utils from "../utils/utils";

const run = () : Promise<any[]> => {
  //1. get List of buy Orders to watch
  return Order.find({"stoploss.observe": "true", "tx.descr.type": "buy"})
    .then((orderList:  IOrderModel[])=> {
        let ccPromises: Promise<any>[] = orderList.map((order) => {
        //2. for each watch the stoploss price
        let fromCurrency = order.tx.descr.pair.substr(0,3);
        if (fromCurrency === 'XBT') { // Kraken to cryptocompare Symbolmap
          fromCurrency = 'BTC';
        }

        let toCurrency = order.tx.descr.pair.substr(3);
        return cc.getPrice(fromCurrency,toCurrency, 'Kraken').then((price: any) =>{
          console.log(`cc observe: ${order.tx.descr.pair} buy price: ${order.tx.price} actuall price: ${price.EUR} stoploss: ${order.tx.stopprice} in % ${process.env.StoplossProcent} amount ${order.tx.vol_exec}`);
          const stoplossStep = Number(order.tx.stopprice) * (1+ Number(process.env.StoplossStepsInProcent))

          //3. if stoploss price hit -> sellOrder
          if (price.EUR < order.tx.stopprice){
            console.log(`${order.tx.descr.pair} is bellow stoploss price: ${order.tx.stopprice}. id: ${order._id}`);
            return sellOrder(order, Number(price.EUR))
          }else if (price.EUR > stoplossStep){
             //4. if marketprice > stoploss by x% then new stoploss (market * 0.98)
             const stoplossPriceRaw: Number =  Number(price.EUR) * Number(process.env.StoplossProcent)
             const stoplossPrice = Number(stoplossPriceRaw.toFixed(process.env.DefaultPrecision))
             console.log(`set new stopprice: ${stoplossPrice}. id: ${order._id} `);

             // update Order in DB
             order.tx.stopprice = stoplossPrice
             return order.save();
           }else{
             return new Promise((resolve, reject) => {resolve()});
           }
          });
        });

      return Promise.all(ccPromises);
    });
};


/**
 put sellOrder and write to Db new Transaction. Don't observe this  anymore.
*/
const sellOrder = (order: IOrderModel, price: number, precision = process.env.DefaultPrecision) : Promise<any> => {
    console.log(`I am going to sell ${order.tx.descr.pair} for ${price}. Amount is ${order.stoploss.vol}`);
    //sendSellNotify(symbol, price, amount);

    let validate: string;
    if(process.env.Environment === 'development') {
      validate = "validate";
    }

    let txid : string;
    let leverage : number;
    if (order.tx.descr.leverage && !isNaN(Number(order.tx.descr.leverage))){
      leverage = Number(order.tx.descr.leverage);
    }
    return kraken.placeOrder(`${order.tx.descr.pair}`, 'sell', 'market', price, order.stoploss.vol , validate, leverage)
          //get Order Information!
          .then((data: any) => {
            txid = data.txid; //TODO txid = array of transaction ids for order (if order was added successfully)
            console.log("sellOrder with txid: "+txid);
            return utils.callPromiseWithIntervall(10, kraken.queryOrders(data.txid))
          }).then((data: any) => {
              //it can happen, that order Info not yet available, then check again!

              let newOrder = {
                user_id: order.user_id,
                txid: txid,
                tx: data[txid]
              }
              //save Order Information
              order.stoploss.observe=false;
              return order.save().then (()=> Order.create(newOrder));
          });
};

// 2 usecase we have Orders wihtout stoploss: then make automatik 5% less stoploss
// async await
let offset = 0;

const watchOpenOrders = (user_id: string) : Promise<any[]> => {
  let precision = process.env.DefaultPrecision;

  return  kraken.getBalance().then((data)=>{
    let balanceCurrency : [string, any][];
    //console.log(data);
    balanceCurrency = Object.entries(data).filter((d)=> d[0]!="ZEUR" && Number(d[1])>0.01);
    return  new Promise((resolve, reject) => {resolve(balanceCurrency)});
  }).then((balanceCurrency: [string, any][])=> {
    var date = new Date();
    date.setDate(1);
    var starttm = Math.round((date).getTime() / 1000);

    return kraken.getClosedOrders(offset, starttm).then((txdata: any) =>{
      offset = txdata.count;
      let filteredOrders = Object.entries(txdata.closed).filter((k: any)=> k[1].status=="closed");

      let orderPromises : Promise<any>[] =  balanceCurrency.map((balanceData : [string, string]) =>{
        console.log(balanceData);

        let orderList = filteredOrders.filter((k: any) => {
          return    balanceData[0].substr(1).concat("EUR") == k[1].descr.pair ||
                    balanceData[0].substr(1).concat("USD") == k[1].descr.pair
         })

        let balanceAmount : number = Number(Number(balanceData[1]).toFixed(precision));
        let accumulated: [number] = [0]; // we have to declare as array, so we cann reassign value in inner function

        // for every find Order in DB
        let dbPromises : Promise<any>[] =  orderList.map((order: any, index)=>{
          let amount: number = Number(Number(order[1].vol_exec).toFixed(precision))
          let timestamp: number =order[1].opentm;

          let tx: any;
          tx = order[1];
          const txid = order[0];

          let stoplossVol: number = 0;

          if (tx.descr.type === "buy"){ // for now only for buy Orders
            stoplossVol = getStoplossVol(accumulated, balanceAmount, amount, timestamp, index)
          }

          let markForStoploss: boolean = stoplossVol>0;
          return createOrder(txid, tx, user_id, markForStoploss, stoplossVol);
        })
        return Promise.all(dbPromises);
      });
      return Promise.all(orderPromises);
    });
  });
}

const getStoplossVol = (accumulated: [number], balanceAmount: number, amount: number, timestamp: number, index: number, precision: number = process.env.DefaultPrecision ) : number =>{
  accumulated[0] = Number((accumulated[0] + amount).toFixed(precision));
  let stoplossVol: number = 0;

  if (Number((balanceAmount - accumulated[0]).toFixed(precision))>=0){
    // balance still positive mark all for stoploss
    console.log(`${index} balance: ${balanceAmount} still positive accumulator: ${accumulated[0]} curr: ${amount} mark for stoploss timestamp: ${timestamp}`)
    stoplossVol= amount;
  }else{  // balance is negative mark for stoploss only the remaining
    // 1. very big Diff (accumulated[0] - balanceAmount ) >= amount => no stoploss
    if (Number((accumulated[0] - balanceAmount).toFixed(precision)) >= amount){
      stoplossVol = 0;
    }else{
      // 2. diff < amount then stoploss = balance - ( accu - currentAmount)
      stoplossVol = Number((balanceAmount - (accumulated[0] - amount)).toFixed(precision));
    }
    console.log(`${index}  balance: ${balanceAmount} is negative accumulator:${accumulated[0]} curr: ${amount} stoplossVol ${stoplossVol} skip timestamp: ${timestamp}`)
  }

  return stoplossVol;
}

const createOrder = (txid: string, tx: any, user_id: string, markForStoploss: boolean, stoplossVol: number, stoplossProcent: number = process.env.StoplossProcent, precision: number = process.env.DefaultPrecision) : Promise<any>=>{

  return Order.findOne({"txid":txid}).exec().then((order)=>{
    if (order){
      // if we have already, then adjust stoplos again
      order.stoploss.observe = markForStoploss;
      order.stoploss.vol = stoplossVol;
      return order.save();
    }else{
        // new Order
        let stoplossPrice = Number((Number(tx.price)*stoplossProcent).toFixed(precision));

        tx.stopprice = stoplossPrice;

        let newOrder =   {
          user_id: user_id,
          txid: txid,
          tx: tx,
          stoploss: { observe: markForStoploss, vol: stoplossVol }
        }
        console.log(`watchOpenOrders: new Order for ${txid} pair: ${tx.descr.pair} price: ${tx.price} stopprice: ${tx.stopprice} for user: ${user_id}`);
        return Order.create(newOrder);
    }
  })
}

const runAll = (user_id: string) => {
  console.log("run All for user: "+user_id)
  run().then(()=>{}).catch((error: any)=> console.log(error));
  watchOpenOrders(user_id).then(()=>{}).catch((error: any)=> console.log(error));
}

export ={ runAll, run, watchOpenOrders };
