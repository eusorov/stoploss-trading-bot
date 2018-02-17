import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: ".env" });

//MongoDb für das direkte setzen und loeschen von Datensaetzen
var mongoose = require('mongoose');
//use q promises
global.Promise = require("q").Promise;
mongoose.Promise = global.Promise;

//var User = require('../src/models/User'); // work if you want to use custom methods
import {User} from '../src/models/User';
import {Order, Transaction} from '../src/models/Order';

let buyTransaction =   {
     //txid : 'OTWMUX-AOBEV-QIEJD3',
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
     vol: 2.0000000,
     vol_exec: 0.00000000,
     cost: '0.00000',
     fee: '0.00000',
     price: '0.00000',
     stopprice: '0.00000',
     limitprice: '0.00000',
     misc: '',
     oflags: 'fciq'
   };
var newOrder =   {
  //user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  tx: buyTransaction,
  stoploss: { observe: true, vol: 0.1}
}

xdescribe("create User with Orders", function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL= 20000;
  // wichtig hier eine extra Connection aufzubauen!!!
  mongoose.connect(process.env.MONGODBTEST_URI, function(err: any, dbcon: any) {
      if (err) {
          console.log('Unable to connect to the server. Please start the server. Error:', err);
          return;
      } else {
          console.log('Connected to Server successfully!');
      }
  });

  beforeAll(function(done){
    User.remove({}, function(error: any){
      var newUser            = new User();
          newUser.email    = "test@gmail.com";
          newUser.name    = "Testuser";
          newUser.provider = 'local';
          newUser.password = newUser.generateHash("abcdef");
          newUser.save(() => {
            done();
          });
    });

  });

	  beforeEach(function(done){
		 Order.remove({}, function(doc){
		      Order.create(newOrder, function(err: any, doc: any){
		    	  if (err) console.log(err);
            done();
		      });
		   });
	  });

    describe("User and Order", function() {

      it("User is available", function(done) {
        const query = User.find(); // `query` is an instance of `Query`
           query.exec(function(err: any, doc: any){
              if (err) console.log(err);
              expect(doc).not.toBeNull();
              done();
           });
       });

       it("Order is available", function(done) {
         const query = Order.find(); // `query` is an instance of `Query`
            query.exec(function(err: any, doc: any){
               if (err) console.log(err);
              //  console.log(doc);
               expect(doc).not.toBeNull();
               expect(doc[0].tx).toBeDefined();
               expect(doc.length).toBe(1);
               done();
            });
        });

        it("User add Order", function(done) {
          User.find().exec().then(doc=>{
             var newOrder2 =   {
               // Order_id: new mongoose.Types.ObjectId(),
               user_id: doc[0]._id,
               txid: 'OTWMUX-AOBEV-QIEJD3',
               tx: buyTransaction,
               stoploss: { observe: true, vol: 550.00}
             }
             return Order.create(newOrder2);
          }).then(pos => {
            expect(pos.user_id).not.toBeNull()
            return Order.find({"user_id": pos.user_id}).exec();
          }).then(posList => {
            //console.log(posList);
          }).catch(err => {console.log(err); expect(err).toBeNull()})
          .then(()=> done());
        });
  	});
});
