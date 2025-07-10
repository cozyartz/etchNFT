import type { APIRoute } from "astro";
import { Alchemy, Network } from "alchemy-sdk";

export const prerender = false;

// Network mapping for Alchemy
const getAlchemyNetwork = (chain: string) => {
  switch (chain.toLowerCase()) {
    case "ethereum":
      return Network.ETH_MAINNET;
    case "polygon":
      return Network.MATIC_MAINNET;
    case "base":
      return Network.BASE_MAINNET;
    default:
      return Network.ETH_MAINNET;
  }
};

// Get Alchemy instance for specific network
const getAlchemyInstance = (chain: string) => {
  const apiKey = import.meta.env.ALCHEMY_API_KEY;
  const network = getAlchemyNetwork(chain);

  return new Alchemy({
    apiKey,
    network,
  });
};

export const GET: APIRoute = async ({ params }) => {
  const address = params.address;
  if (!address) {
    return new Response(JSON.stringify({ error: "Missing address" }), {
      status: 400,
    });
  }

  try {
    // Validate API key
    const apiKey = import.meta.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error("Alchemy API key not configured");
    }

    // Supported chains
    const chains = ["ethereum", "polygon", "base"];
    const allNFTs: any[] = [];

    // Fetch NFTs from each chain
    for (const chain of chains) {
      try {
        const alchemy = getAlchemyInstance(chain);

        // Get NFTs for the wallet address
        const nftsResponse = await alchemy.nft.getNftsForOwner(address, {
          excludeFilters: ["SPAM"],
          omitMetadata: false,
        });

        // Transform Alchemy data to match our expected format
        const transformedNFTs = nftsResponse.ownedNfts.map((nft: any) => ({
          name:
            nft.name || `${nft.contract?.name || "Unknown"} #${nft.tokenId}`,
          collection_name: nft.contract?.name || "Unknown Collection",
          image_url:
            nft.image?.originalUrl ||
            nft.image?.cachedUrl ||
            nft.image?.thumbnailUrl,
          token_id: nft.tokenId,
          contract_address: nft.contract?.address,
          description: nft.description,
          traits: nft.rawMetadata?.attributes || [],
          chain: chain,
        }));

        allNFTs.push(...transformedNFTs);
      } catch (chainError) {
        console.error(`Error fetching NFTs from ${chain}:`, chainError);
        // Continue with other chains even if one fails
      }
    }

    return new Response(JSON.stringify({ nfts: allNFTs }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("NFT fetch error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch NFTs";

    return new Response(
      JSON.stringify({
        error: errorMessage,
        nfts: [],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
