export const subjects = ['General Enquiry','Technical Support','Account Registration','Subscription and Payment','Report a Problem','Feature Suggestion','Partnership or Business Enquiry','Other'];
export function validContact(p) {
  return Boolean(p && typeof p === 'object' && !p.website &&
    ['full_name','email','phone','subject','message','request_id'].every(k => typeof p[k] === 'string') &&
    p.full_name.trim().length >= 2 && p.full_name.length <= 120 && p.email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()) && p.phone.length <= 40 &&
    subjects.includes(p.subject) && p.message.trim().length >= 10 && p.message.length <= 10000 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.request_id));
}

// Bound the body while reading it, including requests without Content-Length.
export async function readContactBody(request, limit = 65536) {
  if (Number(request.headers.get('content-length')) > limit) {
    throw new RangeError('Message is too long.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('Missing message.');
  const decoder = new TextDecoder();
  let bytes = 0;
  let raw = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new RangeError('Message is too long.'); }
      raw += decoder.decode(value, { stream: true });
    }
    return JSON.parse(raw + decoder.decode());
  } finally { reader.releaseLock(); }
}
