export function generateCertSVG(nft: {
  name: string;
  collection_name?: string;
  image_url: string;
  token_id: string;
}) {
  return `
    <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
        .title { font: 700 32px 'Space Grotesk', sans-serif; fill: #00f0ff; text-anchor: middle; }
        .subtitle { font: 600 20px 'Space Grotesk', sans-serif; fill: #ffffff; text-anchor: middle; }
        .meta { font: 400 14px 'Space Grotesk', sans-serif; fill: #888; text-anchor: middle; }
        .border { fill: none; stroke: #00f0ff; stroke-width: 2; }
      </style>
      
      <!-- Background -->
      <rect width="100%" height="100%" fill="#0b0b0f" />
      <rect x="20" y="20" width="760" height="460" class="border" rx="10" />
      
      <!-- Header -->
      <text x="400" y="80" class="title">EtchNFT Certificate</text>
      <text x="400" y="110" class="meta">Official Certificate of Physical Etching</text>
      
      <!-- NFT Details -->
      <text x="400" y="180" class="subtitle">${nft.name || "Untitled NFT"}</text>
      <text x="400" y="210" class="meta">Collection: ${nft.collection_name || "Unknown"}</text>
      <text x="400" y="240" class="meta">Token ID: #${nft.token_id}</text>
      
      <!-- Certificate Info -->
      <text x="400" y="320" class="meta">This certifies that the above NFT has been</text>
      <text x="400" y="345" class="meta">permanently etched into physical form by EtchNFT</text>
      <text x="400" y="370" class="meta">Date: ${new Date().toLocaleDateString()}</text>
      
      <!-- Footer -->
      <text x="400" y="430" class="meta">Verified on-chain • etchnft.com</text>
    </svg>
  `.trim();
}
