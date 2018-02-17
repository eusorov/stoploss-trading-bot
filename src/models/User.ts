import * as mongoose from 'mongoose';
import * as bcrypt from'bcrypt-nodejs';
import {UserI} from "../shared/UserI";

let ObjectId = mongoose.Schema.Types.ObjectId;
let Mixed = mongoose.Schema.Types.Mixed;

interface IUserModel extends UserI, mongoose.Document {
  generateHash(password: string): string;
  validPassword(password: string): boolean;
}

var userSchema = new mongoose.Schema({
  user_id         : String,
  social_id       : String,
  name            : String,
  username        : String,
  email           : String,
  password        : String,
  profile_picture : String,
  provider        : String,
  last_active     : String,
  access_token    : String,
  access_token_secret : String,
  refresh_token   : String,
  groups : [{name :  {type : String, required : true}}]
});

// add admin-Group to specific adress
userSchema.pre('save', function(next) {
  if (this.groups.length==0) {
    this.groups.push({name : 'user'});
  }

  if (this.email === process.env.Username+"@googlemail.com" || this.email === process.env.Username+"@gmail.com"){
    if (!this.groups.some(function (group: string){
        if (group === "admin") return true;
    })){
       this.groups.push({name : 'admin'});
    }
  }
  next();
});

// generating a hash
userSchema.methods.generateHash = function(password: string): string {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

// checking if password is valid
userSchema.methods.validPassword = function(password: string): boolean {
    return bcrypt.compareSync(password, this.password);
};

//var User = mongoose.model<IUserModel>("User", userSchema);
//export = User;
export const User: mongoose.Model<IUserModel> = mongoose.model<IUserModel>("User", userSchema);
