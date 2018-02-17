# Stoploss Trading Bot works only for Kraken Exchange

It automatically detects if you have balance on Exchange with buy Orders. For this buy Orders the bot sets a stoploss.
In Intervall the bot checks current market price and if stoploss is hit, it automatically sets a sell order on Kraken-Exchange.

##.env.example

change .env.example to .env and put your keys thier

### Your Account Key for your Exchange
You provide APIKey and APISign from your Kraken-Account and put in .env.example

APIKey=''
APISign=''

### Setting your stoplossprice
You can set stoploss in Percent. With default 0.98 it means the stoploss will be 2% below your buy price.

StoplossProcent=0.98


### Dynamically adjust stoploss if market goes up by x %
You can set a step by which the market goes up, so you can calculate new stoploss.

StoplossStepsInProcent=0.05
It means if market goes up by 5%, your stoploss will ajust to = marketprice * StoplossProcent


## Features
* TypeScript


## Backend:
* node
* express
* mongodb

## License
[MIT](LICENSE.txt) license.