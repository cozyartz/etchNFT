export function generateCertSVG(nft: {
  name: string;
  collection: string;
  image_url: string;
  token_id: string;
}) {
  return `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font: bold 24px sans-serif; fill: #fff; }
        .meta { font: 14px sans-serif; fill: #ccc; }
      </style>
      <rect width="100%" height="100%" fill="#0b0b0f" />
      <text x="30" y="50" class="title">EtchNFT Certificate</text>
      <text x="30" y="100" class="meta">NFT: ${nft.name}</text>
      <text x="30" y="130" class="meta">Collection: ${nft.collection}</text>
      <text x="30" y="160" class="meta">Token ID: ${nft.token_id}</text>
    </svg>
  `.trim();
}
