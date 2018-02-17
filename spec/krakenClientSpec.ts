//MongoDb für das direkte setzen und loeschen von Datensaetzen
import * as dotenv from "dotenv";
import * as path from "path";

import KrakenClient = require('../src/kraken/krakenclient');

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({ path: ".env" });

let kraken = new KrakenClient(process.env.APIKey, process.env.APISign);

xdescribe("Call KrakenClient", function() {

  it("check Balance", function(done) {
    kraken.api('Balance', {}, function(error: any, data: any) {
        if(error) {
            console.log(error);
        }
        else {
            console.log(data.result);
        }
        done();
    });
   });

  it("check Ticker", function(done) {
  // Get Ticker Info
    kraken.api('Ticker', {"pair": 'XXBTZEUR'}, (error: any, data: any) => {
      if(error) {
          console.log(error);
      }
      else {
          console.log(data.result);
      }
      done();
    });
  });


  it("place Order", function(done) {
    console.log("place Order ...")
    placeOrder('ETHEUR', 'buy', 'limit', '677.00', '0.2', null, "validate").then((data: any) => {
        console.log(data);
      }).catch(function (error: any) {
         console.log("Promise Rejected");
         console.log(error);
      }).then(() => {done();});
  });
});



function placeOrder (pair:string, type:string, ordertype:string, price:string, volume:string, leverage?:string, validate?:string){

  return new Promise((resolve, reject) => {
    let options = {
      pair,
      type ,
      ordertype,
      price,
      volume,
      validate
    }

    kraken.api('AddOrder', options, (error: any, data: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(data.result);
      }
    });

  });
}
