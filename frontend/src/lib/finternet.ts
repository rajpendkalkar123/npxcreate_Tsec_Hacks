import axios from 'axios';

const finternetApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1', 
  headers: {
    'X-API-Key': process.env.NEXT_PUBLIC_FINTERNET_API_KEY, // Use the env variable!
    'Content-Type': 'application/json',
  },
});

export const createPaymentIntent = async (amount: string, description: string) => {
  const response = await finternetApi.post('/payment-intents', {
    amount,
    currency: 'USD', // Or INR if supported
    type: 'DELIVERY_VS_PAYMENT',
    settlementMethod: 'OFF_RAMP_MOCK',
    description,
  });
  return response.data;
};