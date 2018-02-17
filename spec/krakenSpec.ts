//MongoDb für das direkte setzen und loeschen von Datensaetzen
import * as dotenv from "dotenv";
import * as path from "path";

import kraken = require('../src/kraken/kraken');

import * as utils from "../src/utils/utils";

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env.example" });

xdescribe("Call Kraken", function() {

  xit("openOrders", function(done) {
    kraken.getOpenOrders().then((data: any) => {
      if (data.status!=='open'){
        //if yes -> we put a flag in mongodb and tell the watcher to observe the stop-loss price
        console.log(data);
      }
    }).catch((error)=> console.log(error)
    ).then(()=>done());

  });

  xit("closedOrders", function(done) {
    kraken.getBalance().then((data)=>{
      let balanceCurrency : [string, any][];
      balanceCurrency = Object.entries(data).filter((d)=> d[0]!="ZEUR" && Number(d[1])>0.01);
      balanceCurrency.forEach((balanceData) =>{
        // each Balance get latest buy order
        // console.log(balanceData);
      })

      var date = new Date();
      date.setDate(0);
      date.setMonth(0);
      date.setFullYear(2017);
      var starttm = Math.round((date).getTime() / 1000);
      kraken.getClosedOrders(0, starttm).then((txdata: any) =>{
          let filteredOrders = Object.entries(txdata.closed).filter((k: any)=> k[1].status=="closed" &&  k[1].descr.type=="buy");

          let orderPromises = balanceCurrency.map((balanceData) =>{
            console.log(balanceData);
            let balanceAmount : number = balanceData[1];

            let orderList = filteredOrders.filter((k: any) => {
               return balanceData[0].substr(1).concat("EUR") == k[1].descr.pair
             })

             // 1. map for reducing
             let orderListArray = orderList.map((order: any)=>{
               let amount: number =order[1].vol_exec;
               let timestamp: number =order[1].opentm;
               return [amount, timestamp];
             });

             orderListArray.forEach((m)=>{
               console.log(m);
             })

              let accu: [number, number] = [0 , 0];

              orderListArray.forEach((curr, index) =>{
                  accu[0] = Number(accu[0])+ Number(curr[0]);
                  accu[1] = curr[1];
                  if (balanceAmount - accu[0]>=0){
                    // balance still positive mark for stoploss
                    console.log(`${index} balance: ${balanceAmount} still positive accumulator: ${accu[0]} curr: ${curr[0]} mark for stoploss timestamp: ${curr[1]}`)
                  }else{
                   // balance is negative mark for stoploss only the remaining
                   console.log(`${index}  balance: ${balanceAmount} is negative accumulator:${accu[0]} curr:  ${curr[0]} skip timestamp: ${curr[1]}`)
                   }

               })

              //console.log("mapped: " + mapped);
          })

        }).catch((error: any)=> {console.log(error)
        }).then (()=>{done()});
      })
  });

  xit("queryOrders", function(done) {
    utils.callPromiseWithIntervall(3, kraken.queryOrders('OKRGCX-ZQHSU-NFLF4H')).then((txdata: any)=> {
      console.log(txdata);
      done();
    });
  });

  xit("placeOrder", function(done) {
    kraken.placeOrder('ETHEUR', 'buy', 'limit', 610.00, 0.2 , "validate", 2).then((data: any) => {
       console.log(data);
       // write to MonogDb that we have an order!
       // than we check if the order was fullfillied
     }).catch(function (error) {
        console.log(error);
     }).then (()=>{done()})
  });



  xit("placeOrder and get Detail", function(done) {
    kraken.placeOrder('ETHEUR', 'buy', 'market', 610.00, 0.1, "validate", 2 ).then((data: any) => {
       console.log(data);
       //data.txid = 'OTWMUX-AOBEV-QIEJD1';
       kraken.queryOrders(data.txid).then((txdata: any) =>{
         console.log(txdata);
       }).catch((error)=> {console.log(error);
       }).then (()=>{done()});
     }).catch(function (error) {
        console.log(error);
        done();
     });
   });

/** example of open Position
***********{ 'TTRSTQ-D2E7A-ZE4DMC':
   { ordertxid: 'OKRGCX-ZQHSU-NFLF4H',
     posstatus: 'open',
     pair: 'XETHZEUR',
     time: 1518797486.9885,
     type: 'buy',
     ordertype: 'market',
     cost: '74.90000',
     fee: '0.20972',
     vol: '0.10000000',
     vol_closed: '0.00000000',
     margin: '37.45000',
     terms: '0.0200% per 4 hours',
     rollovertm: '1518811886',
     misc: '',
     oflags: '' } }
.***
*/
  it("getOpenPositions for leveraged Orders", function(done) {
       kraken.getOpenPositions().then((data: any) => {
          console.log(data);
          // write to MonogDb that we have an order!
          // than we check if the order was fullfillied
        }).catch(function (error) {
           console.log(error);
        }).then (()=>{done()})
     });
});
