// Match the gateway response to the existing order and verified account email.
// https://paystack.com/docs/payments/verify-payments/
export function verifiedPayment(response, order, email) {
  const payment = response?.data;
  const amount = Math.round(Number(order?.amount) * 100);
  return Boolean(response?.status === true && payment?.status === 'success' &&
    Number.isSafeInteger(amount) && amount > 0 && payment.amount === amount &&
    payment.currency === 'NGN' && payment.reference === order.reference &&
    typeof email === 'string' && email &&
    payment.customer?.email?.toLowerCase() === email.toLowerCase());
}
