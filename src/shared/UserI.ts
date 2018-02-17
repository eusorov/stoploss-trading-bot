export interface UserI {
	user_id 				: string,
  social_id       : string,
  name            : string,
  username        : string,
  email           : string,
  password        : string,
  profile_picture : string,
  provider        : string,
  last_active     : string,
  access_token    : string,
  access_token_secret : string,
  refresh_token   : string,
	groups : [{name :  string}]
};
