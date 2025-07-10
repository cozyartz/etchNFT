import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  let message = "";
  let conversationHistory = [];

  try {
    const body = await request.json();
    message = body.message || "";
    conversationHistory = body.conversationHistory || [];

    // Get Cloudflare AI binding from locals
    const AI = locals.runtime?.env?.AI;

    if (!AI) {
      return new Response(
        JSON.stringify({
          error: "AI service not available",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // System prompt for EtchNFT help bot
    const systemPrompt = `You are EtchNFT Support Bot, an AI assistant for EtchNFT - a service that transforms digital NFTs and custom artwork into premium physical collectibles through laser etching.

ABOUT ETCHNFT:
- EtchNFT bridges digital and physical worlds by creating laser-etched versions of NFTs and custom artwork
- Supports multiple blockchains: Ethereum, Polygon, Solana, and more
- Offers premium materials: wood plaques, acrylic displays, metal engravings, leather items
- Users can pay with crypto (ETH, USDC, etc.) or traditional payment methods (credit cards)
- Provides certificates of authenticity and SVG downloads for each physical item
- Features both curated NFT drops and custom art upload functionality

KEY FEATURES:
- Multi-chain wallet support (MetaMask, Rainbow, Coinbase Wallet, WalletConnect, etc.)
- Real-time NFT gallery browsing from connected wallets
- Custom artwork upload and processing
- AI-powered image optimization for laser engraving
- Custom order processing and tracking
- Worldwide shipping available
- High-quality laser engraving technology with SVG generation

NAVIGATION & PAGES:
- /gallery - View NFTs from connected wallet or upload custom art
- /drops - Browse curated NFT drops available for purchase
- /upload - Dedicated custom artwork upload page
- /my-orders - Track order history and download SVG files
- /help - FAQ and support information

COMMON TOPICS:
- How to connect wallets (MetaMask, Rainbow, etc.)
- NFT viewing and selection from wallet
- Custom artwork upload process
- Order placement and tracking
- Payment methods (crypto and fiat)
- Shipping and delivery worldwide
- Materials and quality (wood, acrylic, metal, leather)
- Pricing and customization options
- SVG file downloads
- Technical troubleshooting

RECENT UPDATES:
- Added custom artwork upload functionality
- Enhanced gallery page with upload tabs
- Improved order tracking with source type indicators
- Added SVG download capability for all orders

TONE: Professional, helpful, and slightly futuristic to match the cyberpunk aesthetic. Use technical terms appropriately but explain them clearly. Always be concise but thorough.

IMPORTANT: If users ask about topics outside of EtchNFT, gently redirect them back to EtchNFT-related questions. Always end responses with an offer to help further.`;

    // Prepare messages for AI
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    // Call Cloudflare AI
    const response = await AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages,
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.9,
      stream: false,
    });

    return new Response(
      JSON.stringify({
        response: response.response,
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("AI Chat Error:", error);

    // Fallback response for common questions
    const fallbackResponses = {
      wallet:
        'To connect your wallet, click the "Connect Wallet" button and select your preferred wallet (MetaMask, Rainbow, etc.). Make sure you have the wallet extension installed.',
      nft: "You can view your NFTs in the Gallery section after connecting your wallet. We support NFTs from Ethereum, Polygon, and Solana networks.",
      upload:
        "You can upload custom artwork by going to the Gallery page and clicking the 'Upload Art' tab, or visiting /upload directly. We support JPEG, PNG, GIF, and WebP formats up to 10MB.",
      order:
        "To place an order, browse your NFTs or upload custom art, select your item, choose your material and size, then proceed to checkout. You can pay with crypto or card.",
      svg: "After placing an order, you can download the SVG file from your order history at /my-orders. The SVG is automatically generated and optimized for laser engraving.",
      shipping:
        "We offer worldwide shipping. Processing time is typically 3-5 business days, with shipping taking 7-14 business days depending on location.",
      drops:
        "Browse our curated NFT drops at /drops to see limited-edition collections available for laser etching on premium materials.",
      support:
        "For additional support, you can check our FAQ section or contact our team directly through the help center.",
    };

    const messageText = message?.toLowerCase() || "";
    let fallbackResponse =
      "I'm having trouble connecting to our AI service right now. ";

    for (const [key, response] of Object.entries(fallbackResponses)) {
      if (messageText.includes(key)) {
        fallbackResponse += response;
        break;
      }
    }

    if (
      fallbackResponse ===
      "I'm having trouble connecting to our AI service right now. "
    ) {
      fallbackResponse +=
        "Please try again or check our FAQ section for common questions.";
    }

    return new Response(
      JSON.stringify({
        response: fallbackResponse,
        success: false,
        fallback: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
