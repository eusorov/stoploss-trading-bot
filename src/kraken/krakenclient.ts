import * as request from "request";
import * as crypto from "crypto";
import * as querystring from "qs";

/**
 * KrakenClient connects to the Kraken.com API
 * @param {String} key    API Key
 * @param {String} secret API Secret
 * @param {Number} [timeoutMS]  MS timeout for requests (optional)
 */
class KrakenClient {

private config: any;

 constructor(key = "", secret = "", timeoutMS: Number = 10000) {
  this.config = {
    url: "https://api.kraken.com",
    version: "0",
    key: key,
    secret: secret,
    timeoutMS: timeoutMS
   };
 }

 /**
  * This method makes a public or private API request.
  * @param  {String}   method   The API method (public or private)
  * @param  {Object}   params   Arguments to pass to the api call
  * @param  {Function} callback A callback function to be executed when the request is complete
  * @return {Object}            The request object
  */
 public api(method: string, params: any, callback: Function) {
  const methods = {
   public: ["Time", "Assets", "AssetPairs", "Ticker", "Depth", "Trades", "Spread", "OHLC"],
   private: ["Balance", "TradeBalance", "OpenOrders", "ClosedOrders", "QueryOrders", "TradesHistory", "QueryTrades", "OpenPositions", "Ledgers", "QueryLedgers", "TradeVolume", "AddOrder", "CancelOrder"]
  };
  if( methods.public.indexOf(method) !== -1) {
   return this.publicMethod( method, params, callback);
  }
   else if(methods.private.indexOf(method) !== -1) {
   return this.privateMethod(method, params, callback);
  }
  else {
   throw new Error(method + " is not a valid API method.");
  }
 }

 /**
  * This method makes a public API request.
  * @param  {String}   method   The API method (public or private)
  * @param  {Object}   params   Arguments to pass to the api call
  * @param  {Function} callback A callback function to be executed when the request is complete
  * @return {Object}            The request object
  */
 private publicMethod(method: string, params: any, callback: Function) {
  params = params || {};

  const path = "/" + this.config.version + "/public/" + method;
  const url  = this.config.url + path;

  return this.rawRequest(url, {}, params, callback);
 }

 /**
  * This method makes a private API request.
  * @param  {String}   method   The API method (public or private)
  * @param  {Object}   params   Arguments to pass to the api call
  * @param  {Function} callback A callback function to be executed when the request is complete
  * @return {Object}            The request object
  */
 private privateMethod(method: string, params: any, callback: Function) {
  params = params || {};

  const path = "/" + this.config.version + "/private/" + method;
  const url  = this.config.url + path;

  params.nonce = +new Date() * 1000; // spoof microsecond

  const signature = this.getMessageSignature(path, params, params.nonce);

  const headers = {
   "API-Key": this.config.key,
   "API-Sign": signature
  };

  return this.rawRequest(url, headers, params, callback);
 }

 /**
  * This method returns a signature for a request as a Base64-encoded string
  * @param  {String}  path    The relative URL path for the request
  * @param  {Object}  request The POST body
  * @param  {Integer} nonce   A unique, incrementing integer
  * @return {String}          The request signature
  */
 private getMessageSignature(path: string, request: any, nonce: Number) {
  const message = querystring.stringify(request);
  const secret = new Buffer(this.config.secret, "base64");
  const hash = crypto.createHash("sha256");
  const hmac = crypto.createHmac("sha512", secret);

  const hash_digest = hash.update(nonce + message).digest("latin1");
  const hmac_digest = hmac.update(path + hash_digest, "latin1").digest("base64");

  return hmac_digest;
 }

 /**
  * This method sends the actual HTTP request
  * @param  {String}   url      The URL to make the request
  * @param  {Object}   headers  Request headers
  * @param  {Object}   params   POST body
  * @param  {Function} callback A callback function to call when the request is complete
  * @return {Object}            The request object
  */
 private rawRequest(url: string, headers: any, params: any, callback: Function) {
  // Set custom User-Agent string
  headers["User-Agent"] = "Kraken Javascript API Client";

  const options = {
   url: url,
   method: "POST",
   headers: headers,
   form: params,
   timeout: this.config.timeoutMS
  };

  const req = request.post(options, function(error, response, body) {
   if(typeof callback === "function") {
    let data;

    if(error) {
     callback(new Error("Error in server response: " + JSON.stringify(error)), undefined);
     return undefined;
    }

    try {
     data = JSON.parse(body);
    }
    catch(e) {
     callback(new Error("Could not understand response from server: " + body), undefined);
     return undefined;
    }

    if(data.error && data.error.length) {
     callback(data.error, undefined);
    }
    else {
     callback(undefined, data);
    }
   }
  });

  return req;
 }
}

export = KrakenClient;
