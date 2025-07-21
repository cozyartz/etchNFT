import type { APIRoute } from 'astro';
import { createOrder } from '../../../lib/paypal';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { cart, form, total } = await request.json();

    if (!cart || cart.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total.toString()
        },
        description: `EtchNFT Physical NFT Etching - ${cart.length} item${cart.length !== 1 ? 's' : ''}`,
        custom_id: `etchnft_${Date.now()}`,
        items: cart.map((nft: any, index: number) => ({
          name: `NFT Etching: ${nft.name}`,
          description: `Physical etching of ${nft.name} from ${nft.collection_name}`,
          unit_amount: {
            currency_code: 'USD',
            value: '29.00'
          },
          quantity: '1',
          category: 'PHYSICAL_GOODS'
        })),
        shipping: {
          name: {
            full_name: form.name
          },
          address: {
            address_line_1: form.addressLine,
            admin_area_2: form.city,
            country_code: form.country === 'United States' ? 'US' : form.country.toUpperCase().substring(0, 2)
          }
        }
      }],
      application_context: {
        return_url: `${new URL(request.url).origin}/order-success`,
        cancel_url: `${new URL(request.url).origin}/checkout`,
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW'
      }
    };

    const order = await createOrder(orderData);
    
    return new Response(JSON.stringify({ id: order.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create PayPal order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};