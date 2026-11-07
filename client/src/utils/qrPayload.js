const escapeWifi = value => value.replace(/[\\;,:"]/g, character => '\\' + character);
const escapeCard = value => value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[;,]/g, character => '\\' + character);
const phone = value => { if (!/^\+?[\d ()-]+$/.test(value)) throw new Error('Enter a valid phone number.'); return value.replace(/[ ()-]/g, ''); };
const email = value => { if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value)) throw new Error('Enter a valid email address.'); return value; };
const httpUrl = value => { const url = new URL(value); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Use an HTTP or HTTPS URL without credentials.'); return url.href; };
const calendarDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) || Number.isNaN(Date.parse(value))) throw new Error('Enter a valid event date and time.');
  return value.replace(/[-:]/g, '') + (value.length === 16 ? '00' : '');
};
export function buildQrPayload(type, fields) {
  const data = fields[type];
  let result = '';
  switch (type) {
    case 'text': result = data; break;
    case 'url': result = data ? httpUrl(data) : ''; break;
    case 'email':
      if (data.address) { const params = new URLSearchParams(); if (data.subject) params.set('subject', data.subject); if (data.body) params.set('body', data.body); result = `mailto:${email(data.address)}${params.size ? '?' + params.toString().replace(/\+/g, '%20') : ''}`; } break;
    case 'phone': result = data.number ? `tel:${phone(data.number)}` : ''; break;
    case 'sms': result = data.phone ? `sms:${phone(data.phone)}${data.message ? '?body=' + encodeURIComponent(data.message) : ''}` : ''; break;
    case 'location':
      if (data.latitude !== '' && data.longitude !== '') {
        const lat = Number(data.latitude), lon = Number(data.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Latitude must be -90 to 90 and longitude -180 to 180.');
        result = `geo:${lat},${lon}`;
      } break;
    case 'wifi':
      if (data.ssid) result = `WIFI:T:${data.encryption};S:${escapeWifi(data.ssid)};${data.encryption !== 'nopass' ? 'P:' + escapeWifi(data.password) + ';' : ''};`; break;
    case 'event':
      if (data.title && data.start) {
        if (data.end && Date.parse(data.end) < Date.parse(data.start)) throw new Error('Event end must follow the start.');
        result = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT', `SUMMARY:${escapeCard(data.title)}`, `DTSTART:${calendarDate(data.start)}`, ...(data.end ? [`DTEND:${calendarDate(data.end)}`] : []), ...(data.location ? [`LOCATION:${escapeCard(data.location)}`] : []), ...(data.description ? [`DESCRIPTION:${escapeCard(data.description)}`] : []), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      } break;
    case 'contact':
      if (data.name) result = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeCard(data.name)}`, ...(data.phone ? [`TEL:${phone(data.phone)}`] : []), ...(data.email ? [`EMAIL:${email(data.email)}`] : []), ...(data.address ? [`ADR:;;${escapeCard(data.address)};;;;`] : []), ...(data.website ? [`URL:${httpUrl(data.website)}`] : []), 'END:VCARD'].join('\r\n'); break;
    default: throw new Error('Choose a supported content type.');
  }
  if (new TextEncoder().encode(result).length > 1000) throw new Error('QR content is too long. Use at most 1,000 UTF-8 bytes.');
  return result;
}
export function checkQrColors(foreground, background) {
  const luminance = color => {
    if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Use six-digit hexadecimal colors.');
    const values = color.slice(1).match(/../g).map(hex => parseInt(hex, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  const dark = luminance(foreground), light = luminance(background);
  if ((light + 0.05) / (dark + 0.05) < 4.5) throw new Error('Choose a darker QR color and a lighter background with stronger contrast.');
}
