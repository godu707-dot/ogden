import { ethers } from "ethers";
import ABI from "../contracts/DenExecutor.abi";

/**
 * Fetches all supported DEX router addresses from the deployed contract.
 * Returns a registry object: { name: string, address: string }
 */
export async function fetchDexRegistry(rpcUrl: string, contractAddress: string) {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, ABI, provider);
  const dexNames = [
    "UNISWAP_V2_ROUTER",
    "UNISWAP_V3_ROUTER",
    "UNISWAP_V3_QUOTER",
    "SUSHISWAP_ROUTER",
    "CURVE_ROUTER",
    "BALANCER_VAULT",
    "DODO_V2_ROUTER",
    "PANCAKESWAP_ROUTER"
  ];

  const registry: Record<string, string> = {};
  // Add 1inch aggregator (static mainnet address)
  // 1inch v5 router: Tolstoy's address: https://etherscan.io/address/0x1111111254EEB25477B68fb85Ed929f73A960582
  registry["ONEINCH_ROUTER"] = "0x1111111254EEB25477B68fb85Ed929f73A960582";
  for (const name of dexNames) {
    try {
      const addr = await contract[name]();
      registry[name] = addr;
    } catch (err) {
      // skip if not present
    }
  }
  return registry;
}