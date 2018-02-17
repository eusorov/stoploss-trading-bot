import * as mongoose from 'mongoose';
import {TransactionI, OrderI} from "../shared/OrderI";

let ObjectId = mongoose.Schema.Types.ObjectId;
let Mixed = mongoose.Schema.Types.Mixed;

export interface ITransactionModel extends TransactionI, mongoose.Document {
}
export interface IOrderModel extends OrderI, mongoose.Document {
}

/** example return
{ 'OTWMUX-AOBEV-QIEJD3':
   { refid: null,
     userref: 0,
     status: 'open',
     opentm: 1518110172.9204, //opentm = unix timestamp of when order was placed
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
	 }
 }
*/

var closeSchema = new mongoose.Schema({
  any: mongoose.Schema.Types.Mixed
});
var descrSchema = new mongoose.Schema({
	   pair: String,
		 type: String,
		 ordertype: String,
		 price: Number,
		 price2: Number,
		 leverage: String,
		 order: String,
		 close: mongoose.Schema.Types.Mixed
});

var transactionSchema = new mongoose.Schema({
	 txid:  String,
	 refid: String,
	 userref: Number,
	 status: String,
	 opentm: Number,
	 starttm: Number,
	 expiretm: Number,
	 descr: descrSchema,
	 vol: Number,
	 vol_exec: Number,
	 fee: Number,
	 price: Number,
	 stopprice: Number,
	 limitprice: Number,
	 misc: String,
	 oflags: String
 });


let orderSchema = new mongoose.Schema({
   order_id: {type: mongoose.Schema.Types.ObjectId},
   user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   txid: String,
   tx: transactionSchema,
   stoploss: { observe: Boolean, vol: Number}
});

/**
do some stuff before save
*/
orderSchema.pre('save', function(next) {
   next();
});

export const Transaction: mongoose.Model<ITransactionModel> = mongoose.model<ITransactionModel>("Transaction", transactionSchema);
export const Order: mongoose.Model<IOrderModel> = mongoose.model<IOrderModel>("Order", orderSchema);
