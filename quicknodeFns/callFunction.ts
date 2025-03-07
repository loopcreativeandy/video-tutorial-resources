import axios from 'axios';

const API_URL = "https://api.quicknode.com/functions/rest/v1/functions/1c50c841-5853-44d0-ae4f-cdd898ac3fb9/call?result_only=true";
const API_KEY = "QN_3de1994c5b664790b2f5fe693754ddeb";

const requestData = {
  network: "solana-mainnet",
  dataset: "block",  
  user_data: {
    name: "Andy"
  }
};

async function callQuickNodeFunction() {
  try {
    const response = await axios.post(API_URL, requestData, {
      headers: {
        "accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      }
    });
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error calling QuickNode API:", error);
  }
}

async function main() {
    const response = await callQuickNodeFunction();
    // if (response.returnData.data) {
    //     console.log(JSON.stringify(response.returnData.data,undefined,2));
    // } else {
    //     console.log("no data in response")
    // }
}

main();
