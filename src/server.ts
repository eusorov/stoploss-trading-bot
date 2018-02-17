/* Load .env variables to process.env */
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: ".env" });

var mongoose = require('mongoose');
import stoplossbot = require('./tradingbot/stoplossbot');

//use q promises
global.Promise = require("q").Promise;
mongoose.Promise = global.Promise;

mongoose.connect(process.env.MONGODB_URI, function(err: any, dbcon: any) {
    if (err) {
        console.log('Unable to connect to the server. Please start the server. Error:', err);
        return;
    } else {
        console.log('Connected to Server successfully!');
    }
});

let tickConfig = parseInt(process.env.Tick);

import {Order} from './models/Order';
import {User} from './models/User';

var newUser            = new User();
    newUser.email    = process.env.Useremail;
    newUser.name     = process.env.Username;
    newUser.username = process.env.UserFullname;
    newUser.provider = process.env.Userprovider;
    newUser.password = newUser.generateHash(process.env.Userpass);


Order.remove({}).exec().then(() => User.remove({}).exec()
  ).then(()=> newUser.save()
  ).then((user: any)=>{

  const tick = 1000 * tickConfig;
  setInterval(stoplossbot.runAll, tick);
  stoplossbot.runAll(user._id);

})
