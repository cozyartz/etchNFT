import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const address = params.address;
  if (!address) {
    return new Response(JSON.stringify({ error: "Missing address" }), {
      status: 400,
    });
  }

  try {
    // Use SimpleHash API for comprehensive NFT data
    const url = `https://api.simplehash.com/api/v0/nfts/owners?wallet_addresses=${address}&chains=ethereum,polygon,base,optimism&limit=50`;
    const res = await fetch(url, {
      headers: {
        "X-API-KEY": import.meta.env.SIMPLEHASH_API_KEY || "",
      },
    });

    if (!res.ok) {
      throw new Error(`SimpleHash API error: ${res.status}`);
    }

    const data = await res.json();

    // Transform the data to match our expected format
    const transformedNFTs =
      data.nfts?.map((nft: any) => ({
        name: nft.name || `${nft.collection.name} #${nft.token_id}`,
        collection_name: nft.collection.name,
        image_url: nft.image_url || nft.previews?.image_medium_url,
        token_id: nft.token_id,
        contract_address: nft.contract_address,
        description: nft.description,
        traits: nft.extra_metadata?.attributes || [],
      })) || [];

    return new Response(JSON.stringify({ nfts: transformedNFTs }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error("NFT fetch error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch NFTs",
        nfts: [],
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
