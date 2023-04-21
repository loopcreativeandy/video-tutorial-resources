import axios from "axios";

const HELIUS_RPC = "https://rpc-devnet.helius.xyz/?api-key=30536abf-e8e7-444f-a255-18e9a0c27e8b";

export async function getAsset(assetId: any, rpcUrl = HELIUS_RPC): Promise<any> {
    try {
        const axiosInstance = axios.create({
            baseURL: rpcUrl,
          });
      const response = await axiosInstance.post(rpcUrl, {
        jsonrpc: "2.0",
        method: "getAsset",
        id: "rpd-op-123",
        params: {
          id: assetId
        },
      });
      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }

  
export async function getAssetProof(assetId: any, rpcUrl = HELIUS_RPC): Promise<any> {
    try {
        
        const axiosInstance = axios.create({
            baseURL: rpcUrl,
          });
      const response = await axiosInstance.post(rpcUrl, {
        jsonrpc: "2.0",
        method: "getAssetProof",
        id: "rpd-op-123",
        params: {
          id: assetId
        },
      });
      return response.data.result;
    } catch (error) {
      console.error(error);
    }
  }