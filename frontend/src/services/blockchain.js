import { ethers } from "ethers";
import { useWalletStore } from "./walletStore";
import StudentMarks from "../abis/StudentMarks.json";

const LOCAL_CHAIN_ID = "0x539"; 

let cachedProvider = null;

export async function getProvider() {
  const { provider } = useWalletStore.getState();

  if (provider) return provider;
  if (!window.ethereum) throw new Error("MetaMask not available");

  // Create and cache provider
  if (!cachedProvider) {
    cachedProvider = new ethers.BrowserProvider(window.ethereum);
    let network = await cachedProvider.getNetwork();

    if (network.chainId !== 1337) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: LOCAL_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: LOCAL_CHAIN_ID,
                chainName: "Localhost 8545",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      cachedProvider = new ethers.BrowserProvider(window.ethereum);
    }
  }

  return cachedProvider;
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}

export async function getConnectedAccount() {
  const signer = await getSigner();
  return signer.getAddress();
}

export async function initWallet() {
  const address = await getConnectedAccount();
  console.log("Connected account:", address);
  return address;
}

export const CONTRACTS = {
  studentMarks: {
    address: "0x29cf1b68a3916972b05f17f5b17e2d81b4aea68e",
    abi: StudentMarks.abi,
  },
};

export async function getContract(name, withSigner = true) {
  const def = CONTRACTS[name];
  if (!def) throw new Error(`Unknown contract: ${name}`);

  const provider = await getProvider();
  const runner = withSigner ? await getSigner() : provider;

  return new ethers.Contract(def.address, def.abi, runner);
}

export async function fetchRoleFor(address) {
  return null;
}

export async function fetchStudentTranscript(address) {
  return { subjects: [], percentage: 0, status: "PENDING" };
}

export async function submitMarks(subjectId, studentAddress, marks) {
  return { txHash: "0x" };
}

export async function adminPublishResults() {
  return { txHash: "0x" };
}
