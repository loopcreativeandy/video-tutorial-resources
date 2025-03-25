
import {
    SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE,
    SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND,
    isSolanaError,
} from '@solana/errors';

const ERROR_TO_FIND = SOLANA_ERROR__TRANSACTION_ERROR__BLOCKHASH_NOT_FOUND; // put error to find here

(async ()=>{

    try {
        // your code goes here

    } catch (e) {
        console.log(e)
        if (isSolanaError(e)){
            console.log("this is a Solana error!");
        }
        if (isSolanaError(e, SOLANA_ERROR__JSON_RPC__SERVER_ERROR_SEND_TRANSACTION_PREFLIGHT_FAILURE)){
            console.log("error with cause!");
            e = e.cause;
        }
        if (isSolanaError(e, ERROR_TO_FIND)) {
            console.log(e)
            const message = e.message
            console.log("Congratulations! you found the \""+message+"\" error!");
        } else {
            throw e;
        }
        
    }


})();
