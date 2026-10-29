// Official business support contacts. Keep account and administrator credentials separate.
const email = 'ahmadadebara04@gmail.com';
const whatsappNumber = '2348109606739';
const whatsappMessage = 'Hello PoultryPro Support, I would like to make an enquiry about your poultry farm management platform.';

export const SUPPORT_CONTACT = Object.freeze({
  email,
  phone: '08109606739',
  internationalPhone: `+${whatsappNumber}`,
  whatsappNumber,
  whatsappMessage,
  emailSubject: 'PoultryPro Support Enquiry',
  emailUrl: `mailto:${email}?subject=${encodeURIComponent('PoultryPro Support Enquiry')}`,
  whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`,
});
