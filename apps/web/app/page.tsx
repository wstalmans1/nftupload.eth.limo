"use client";

import { useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract
} from "wagmi";
import { parseEventLogs } from "viem";
import { sepolia } from "wagmi/chains";
import { NFTUPLOAD_ABI, NFTUPLOAD_ADDRESS } from "../lib/contract";

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";

function normalizeCid(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("ipfs://")) {
    return trimmed.slice("ipfs://".length);
  }
  const ipfsIndex = trimmed.indexOf("/ipfs/");
  if (ipfsIndex !== -1) {
    return trimmed.slice(ipfsIndex + "/ipfs/".length);
  }
  return trimmed;
}

async function uploadMetadata(imageCid: string, name: string) {
  if (!PINATA_JWT) {
    throw new Error(
      "Missing NEXT_PUBLIC_PINATA_JWT. Provide a metadata CID manually or set the env var."
    );
  }

  const metadata = {
    name,
    description: "Minted on Sepolia via nftupload",
    image: `ipfs://${imageCid}`
  };

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Pinata upload failed.");
  }

  const data = (await response.json()) as { IpfsHash?: string };
  if (!data.IpfsHash) {
    throw new Error("Pinata response missing IpfsHash.");
  }

  return `ipfs://${data.IpfsHash}`;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const contractAddress = NFTUPLOAD_ADDRESS;
  const readAddress =
    contractAddress || "0x0000000000000000000000000000000000000000";
  const { data: nextTokenId } = useReadContract({
    address: readAddress,
    abi: NFTUPLOAD_ABI,
    functionName: "nextTokenId",
    query: {
      enabled: Boolean(contractAddress)
    }
  });

  const [imageCid, setImageCid] = useState("");
  const [customName, setCustomName] = useState("");
  const [metadataCid, setMetadataCid] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [tokenUri, setTokenUri] = useState<string | null>(null);
  const [lastMint, setLastMint] = useState<{
    name: string;
    imageCid: string;
    tokenUri: string;
    txHash: `0x${string}`;
    tokenId?: string;
    timestamp: number;
  } | null>(null);

  const normalizedImageCid = useMemo(() => normalizeCid(imageCid), [imageCid]);
  const normalizedMetadataCid = useMemo(
    () => normalizeCid(metadataCid),
    [metadataCid]
  );
  const defaultName = nextTokenId ? `Photo #${nextTokenId.toString()}` : "Photo";
  const nextName = customName.trim() || defaultName;

  const isWrongNetwork = isConnected && chainId !== sepolia.id;

  const handleMint = async () => {
    setError(null);
    setStatus(null);
    setTxHash(null);
    setTokenId(null);
    setTokenUri(null);
    setLastMint(null);

    if (!contractAddress) {
      setError("Missing NEXT_PUBLIC_CONTRACT_ADDRESS.");
      return;
    }

    if (!normalizedImageCid) {
      setError("Please enter a valid image CID.");
      return;
    }

    if (!address) {
      setError("Connect your wallet to continue.");
      return;
    }

    try {
      setStatus("Preparing metadata...");
      const mintName = nextName;
      const mintImageCid = normalizedImageCid;
      let uri = "";
      if (normalizedMetadataCid) {
        if (customName.trim()) {
          setStatus("Using provided metadata CID; name input is ignored.");
        }
        uri = `ipfs://${normalizedMetadataCid}`;
      } else {
        uri = await uploadMetadata(normalizedImageCid, nextName);
      }

      setTokenUri(uri);
      setStatus("Sending mint transaction...");

      const hash = await writeContractAsync({
        address: contractAddress,
        abi: NFTUPLOAD_ABI,
        functionName: "mint",
        args: [uri]
      });

      setTxHash(hash);
      setStatus("Transaction sent. Waiting for confirmation...");

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash
      });

      if (receipt) {
        let mintedTokenId: string | undefined;
        try {
          const logs = parseEventLogs({
            abi: NFTUPLOAD_ABI,
            eventName: "Minted",
            logs: receipt.logs
          });

          const minted = logs[0];
          if (minted && "tokenId" in minted.args) {
            mintedTokenId = minted.args.tokenId.toString();
            setTokenId(mintedTokenId);
          }
        } catch {
          // Non-critical: log parsing can fail if the provider omits logs.
        }

        setStatus("Minted on Sepolia.");
        setLastMint({
          name: mintName,
          imageCid: mintImageCid,
          tokenUri: uri,
          txHash: hash,
          tokenId: mintedTokenId,
          timestamp: Date.now()
        });
        setImageCid("");
        setCustomName("");
        setMetadataCid("");
      } else {
        setStatus("Transaction sent. Check your wallet for confirmation.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mint failed.";
      setError(message);
    }
  };

  return (
    <main>
      <div className="shell">
        <div>
          <span className="pill">Sepolia · client-only</span>
          <h1 className="title">NFTupload</h1>
          <p className="subtitle">
            Enter an image CID, the app pins metadata to IPFS, then mints a
            single ERC721 to your wallet.
          </p>
        </div>

        <div className="card">
          <div className="footer">
            <div>
              <div className="label">Wallet</div>
              <div className="meta">Connect with Sepolia</div>
            </div>
            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>

          <div className="row">
            <label className="label" htmlFor="imageCid">
              Image CID
            </label>
            <input
              id="imageCid"
              className="input"
              placeholder="bafy..."
              value={imageCid}
              onChange={(event) => setImageCid(event.target.value)}
            />
          </div>

          <div className="row">
            <label className="label" htmlFor="customName">
              NFT Name (optional)
            </label>
            <input
              id="customName"
              className="input"
              placeholder={defaultName}
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
            />
          </div>

          <div className="row">
            <label className="label" htmlFor="metadataCid">
              Metadata CID (optional)
            </label>
            <input
              id="metadataCid"
              className="input"
              placeholder="Leave empty to pin via Pinata"
              value={metadataCid}
              onChange={(event) => setMetadataCid(event.target.value)}
            />
          </div>

          {isWrongNetwork && (
            <div className="status error">
              Switch your wallet to Sepolia.
            </div>
          )}

          {error && <div className="status error">{error}</div>}
          {status && <div className="status">{status}</div>}

          <button
            className="button"
            onClick={handleMint}
            disabled={isPending || isWrongNetwork}
          >
            {isPending ? "Minting..." : "Mint NFT"}
          </button>

          {lastMint && (
            <div className="status">
              <strong>Mint confirmed.</strong>
              <div className="meta">
                <div>Name: {lastMint.name}</div>
                <div>Image CID: {lastMint.imageCid}</div>
                <div>Token URI: {lastMint.tokenUri}</div>
                {lastMint.tokenId && <div>Token ID: {lastMint.tokenId}</div>}
                <div>Tx: {lastMint.txHash}</div>
                <div>
                  Time: {new Date(lastMint.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="meta">
            <div>
              Contract: {NFTUPLOAD_ADDRESS || "set NEXT_PUBLIC_CONTRACT_ADDRESS"}
            </div>
            <div>Next name: {nextName}</div>
            {tokenUri && <div>Token URI: {tokenUri}</div>}
            {tokenId && <div>Token ID: {tokenId}</div>}
            {txHash && <div>Tx: {txHash}</div>}
          </div>
        </div>

        <div className="footer">
          <span>Metadata is pinned to IPFS for best wallet support.</span>
          <span>
            Uses Pinata JWT when available; otherwise paste a metadata CID.
          </span>
        </div>
      </div>
    </main>
  );
}
