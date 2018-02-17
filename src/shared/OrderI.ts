export interface TransactionI{
	 refid: String,
	 userref: String,
	 status: String,
	 opentm: Number,
	 starttm: Number,
	 expiretm: Number,
	 descr: {
		 pair: String,
		 type: String,
		 ordertype: String,
		 price: Number,
		 price2: Number,
		 leverage: String,
		 order: String,
		 close: {any: {}}
	 },
	 vol: Number,
	 vol_exec: Number,
	 fee: Number,
	 price: Number,
	 stopprice: Number,
	 limitprice: Number,
	 misc: String,
	 oflags: String
 };

export interface OrderI {
	order_id: string,
	user_id: string,
	txid: string,
 	tx: TransactionI,
	stoploss: { observe: Boolean, vol: Number}
};
