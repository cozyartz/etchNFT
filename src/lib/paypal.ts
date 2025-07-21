import { Client, LogLevel, Environment } from '@paypal/paypal-server-sdk';

// Initialize PayPal SDK with proper error handling
const getPayPalClient = () => {
  const clientId = import.meta.env.PAYPAL_CLIENT_ID;
  const clientSecret = import.meta.env.PAYPAL_CLIENT_SECRET;
  const environment = import.meta.env.PAYPAL_ENVIRONMENT || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error(
      'PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.'
    );
  }

  if (!['sandbox', 'live'].includes(environment)) {
    throw new Error(
      'Invalid PAYPAL_ENVIRONMENT. Must be either "sandbox" or "live".'
    );
  }

  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: clientId,
      oAuthClientSecret: clientSecret,
    },
    environment: environment === 'live' ? Environment.Production : Environment.Sandbox,
    logging: {
      logLevel: LogLevel.INFO,
      logRequest: { logBody: true, logHeaders: true },
      logResponse: { logBody: true, logHeaders: true }
    }
  });
};

export const createOrder = async (orderData: any) => {
  try {
    const client = getPayPalClient();
    const ordersController = client.ordersController;
    
    const result = await ordersController.ordersCreate({
      body: orderData
    });

    if (result.statusCode !== 201) {
      throw new Error(`PayPal order creation failed with status: ${result.statusCode}`);
    }

    return result.body;
  } catch (error) {
    console.error('PayPal create order error:', error);
    throw error;
  }
};

export const captureOrder = async (orderId: string) => {
  try {
    const client = getPayPalClient();
    const ordersController = client.ordersController;
    
    const result = await ordersController.ordersCapture({
      id: orderId,
      body: {
        // Add any capture-specific data if needed
      }
    });

    if (result.statusCode !== 201) {
      throw new Error(`PayPal order capture failed with status: ${result.statusCode}`);
    }

    return result.body;
  } catch (error) {
    console.error('PayPal capture order error:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string) => {
  try {
    const client = getPayPalClient();
    const ordersController = client.ordersController;
    
    const result = await ordersController.ordersGet({
      id: orderId
    });

    if (result.statusCode !== 200) {
      throw new Error(`PayPal get order failed with status: ${result.statusCode}`);
    }

    return result.body;
  } catch (error) {
    console.error('PayPal get order error:', error);
    throw error;
  }
};

export const refundPayment = async (captureId: string, amount?: { currency_code: string; value: string }) => {
  try {
    const client = getPayPalClient();
    const paymentsController = client.paymentsController;
    
    const refundData: any = {};
    if (amount) {
      refundData.amount = amount;
    }

    const result = await paymentsController.capturesRefund({
      captureId,
      body: refundData
    });

    if (result.statusCode !== 201) {
      throw new Error(`PayPal refund failed with status: ${result.statusCode}`);
    }

    return result.body;
  } catch (error) {
    console.error('PayPal refund error:', error);
    throw error;
  }
};