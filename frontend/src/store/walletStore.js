import { create } from "zustand";
import detectEthereumProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../contracts/contract";

const LOCAL_CHAIN_ID = "0x539"; // Ganache 1337

export const useWalletStore = create((set, get) => ({
  address: null,
  chainId: null,
  role: null,
  isConnecting: false,
  error: null,
  provider: null,
  signer: null,

  setRole: (role) => set({ role }),

  connect: async () => {
    try {
      set({ isConnecting: true, error: null });

      const detectedProvider = await detectEthereumProvider({
        mustBeMetaMask: true,
      });
      if (!detectedProvider)
        throw new Error("MetaMask not found. Please install it.");

      // 🔑 Force MetaMask to prompt account selection every time
      await detectedProvider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // Ensure correct network (Ganache)
      let currentChainId = await detectedProvider.request({
        method: "eth_chainId",
      });
      if (currentChainId !== LOCAL_CHAIN_ID) {
        try {
          await detectedProvider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: LOCAL_CHAIN_ID }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await detectedProvider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: LOCAL_CHAIN_ID,
                  chainName: "Localhost 8545",
                  rpcUrls: ["http://127.0.0.1:8545"],
                  nativeCurrency: {
                    name: "Ethereum",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Create ethers provider & signer
      const provider = new ethers.BrowserProvider(detectedProvider);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const chainId = (await provider.getNetwork()).chainId.toString();
      console.log("Account:", address);
      const net = await provider.getNetwork();
      console.log("Connected chainId:", net.chainId.toString());

      set({
        address,
        chainId,
        provider,
        signer,
        role: null,
        isConnecting: false,
      });

      // Listen for account/network changes
      if (detectedProvider.on) {
        detectedProvider.on("accountsChanged", async (accs) => {
          const newAddress = accs[0] || null;
          if (!newAddress) {
            set({ address: null, provider: null, signer: null, role: null });
          } else {
            const newProvider = new ethers.BrowserProvider(detectedProvider);
            const newSigner = await newProvider.getSigner();
            set({
              address: newAddress,
              provider: newProvider,
              signer: newSigner,
            });
          }
        });

        detectedProvider.on("chainChanged", async (cid) => {
          if (cid !== LOCAL_CHAIN_ID) {
            console.warn("Wrong network. Please switch to Ganache.");
          }
          const newProvider = new ethers.BrowserProvider(detectedProvider);
          const newSigner = await newProvider.getSigner();
          set({ provider: newProvider, signer: newSigner, chainId: cid });
        });
      }
    } catch (e) {
      set({ error: e.message, isConnecting: false });
      console.error("Wallet connection failed:", e);
    }
  },

  disconnect: () => {
    set({
      address: null,
      chainId: null,
      role: null,
      provider: null,
      signer: null,
    });
  },
  addStudent: async (name) => {
    const { signer } = get();
    if (!signer) {
      set({ error: "Wallet not connected. Please connect first." });
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      const transaction = await contract.addStudent(name);
      await transaction.wait();
      set({ error: null });
      console.log(`Student "${name}" added successfully.`);
    } catch (err) {
      set({ error: err.message });
      console.error("Error adding student:", err);
    }
  },

  // New function to add a teacher
  addTeacher: async (name, subject) => {
    const { signer } = get();
    if (!signer) {
      set({ error: "Wallet not connected. Please connect first." });
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      const transaction = await contract.addTeacher(name, subject);
      await transaction.wait();
      set({ error: null });
      console.log(`Teacher "${name}" added successfully.`);
    } catch (err) {
      set({ error: err.message });
      console.error("Error adding teacher:", err);
    }
  },

  // New function to add marks
  addMarks: async (studentIndex, teacherIndex, mark) => {
    const { signer } = get();
    if (!signer) {
      set({ error: "Wallet not connected. Please connect first." });
      return;
    }
    try {
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      const transaction = await contract.addMarks(
        studentIndex,
        teacherIndex,
        mark
      );
      await transaction.wait();
      set({ error: null });
      console.log(`Marks added successfully for student ${studentIndex}.`);
    } catch (err) {
      set({ error: err.message });
      console.error("Error adding marks:", err);
    }
  },
  // New function to calculate CPI
  calculateCPI: async (studentIndex) => {
    const { provider } = get();
    if (!provider) {
      set({ error: "Provider not available. Please connect wallet." });
      return null;
    }
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const cpi = await contract.calculateCPI(studentIndex);
      set({ error: null });
      return ethers.formatUnits(cpi, 18);
    } catch (err) {
      set({ error: err.message });
      console.error("Error calculating CPI:", err);
      return null;
    }
  },
  
  // New function to get a single student's data
  getStudent: async (studentIndex) => {
    const { provider } = get();
    if (!provider) {
      set({ error: "Provider not available. Please connect wallet." });
      return null;
    }
    try {
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const student = await contract.students(studentIndex);
      console.log("student", student);
      set({ error: null });
      return student;
    } catch (err) {
      set({ error: err.message });
      console.error("Error fetching student:", err);
      return null;
    }
  },
}));
