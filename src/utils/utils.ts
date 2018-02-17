/**
Function which calls the promise and if the result of the promise is empty (e.g nor results are now available)
so we try after intervall (defatul 1sec) again. Limit is the max retries.

return is a promise with result.
*/
export function callPromiseWithIntervall(limit: number, promiseToCall: Promise<any>, intervall: number = 1000) {
    let i = 0;
    let promise = new Promise((resolve, reject)=>{
      var itid = setInterval(function (txdata: any) {
          promiseToCall.then((txdata: any)=>{
            if (i === limit - 1 || txdata) {
              clearInterval(itid);
              resolve(txdata);
            }
            i++;
          });
      }, intervall);
      });

    return promise;
}
