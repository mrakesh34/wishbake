import { apiUrl } from '../services/api.js';

export const DELIVERY_FEE_INR = 149;
export const NIGHT_SLOT_FEE_INR = 99;

export const PRESET_SIZE_MULTIPLIERS = {
  '0.5lb': 0.6,
  '1lb': 1.0,
  '3lb': 1.5
};

export const BHUBANESWAR_PINCODES = {
  '751001': 'Bhubaneswar GPO / Kharavela Nagar',
  '751002': 'Unit-2 / Ashok Nagar / Bapujee Nagar',
  '751003': 'Baramunda / Ghatikia / Bharatpur',
  '751004': 'Utkal University / Vani Vihar',
  '751005': 'Sainik School / Gajapati Nagar',
  '751006': 'Budheswari Colony / Kalpana Square',
  '751007': 'Saheed Nagar / V.S.S. Nagar',
  '751008': 'Rajbhawan / Gopabandhu Nagar',
  '751009': 'Ashok Nagar / Station Square',
  '751010': 'Rasulgarh',
  '751011': 'CRP Lines / Nayapalli',
  '751012': 'Nayapalli / IRC Village',
  '751013': 'RRL / Acharya Vihar',
  '751014': 'BJB Nagar / Lewis Road',
  '751015': 'IRC Village / Jayadev Vihar',
  '751016': 'Chandrasekharpur',
  '751017': 'Mancheswar',
  '751018': 'Badagarh Brit Colony',
  '751019': 'Dumduma Housing Board Colony',
  '751020': 'Aerodrome Area / Bhimtangi',
  '751021': 'Sailashree Vihar',
  '751022': 'Acharya Vihar / Bhoinagar',
  '751023': 'S.E. Railway Project Complex / Niladri Vihar',
  '751024': 'Patia / Kalarahanga',
  '751025': 'GGP Colony / Rasulgarh',
  '751026': 'Bhubaneswar Parcel Centre',
  '751027': 'Bhubaneswar IBC',
  '751028': 'Tamando',
  '751029': 'Chandaka / Ghatikia',
  '751030': 'Khandagiri',
  '751031': 'Patia / KIIT',
  '751032': 'Pahal / Hanspal',
  '752050': 'Jatni / Arugul (IIT Bhubaneswar)',
  '752054': 'Gangapada / Kantabad',
  '752055': 'Khordha Town',
  '752100': 'Balakati',
  '752101': 'Balianta / Jagannathpur',
  '752102': 'Athantar / Kakarudrapur',
  '752103': 'Banamalipur'
};

let serviceablePincodes = { ...BHUBANESWAR_PINCODES };

export async function syncServiceablePincodes() {
  try {
    const res = await fetch(apiUrl('/api/delivery/pincodes'));
    if (!res.ok) return;
    const payload = await res.json();
    if (payload?.status === 'success' && payload.data && typeof payload.data === 'object') {
      serviceablePincodes = { ...BHUBANESWAR_PINCODES, ...payload.data };
    }
  } catch {
    // Fallback to built-in Bhubaneswar PIN code list
  }
}

export function getPincodeLocality(pin) {
  return serviceablePincodes[(pin || '').trim()] || null;
}

const SERVICEABLE_CITIES = {
  bhubaneswar: 'Bhubaneswar',
  bbsr: 'Bhubaneswar',
  jatni: 'Jatni',
  khordha: 'Khordha',
  khurda: 'Khordha',
  balianta: 'Balianta',
  balakati: 'Balakati'
};

const SERVICEABLE_STATES = {
  odisha: 'Odisha',
  orissa: 'Odisha'
};

const PHONE_REGEX = /^(?:\+91[\-\s]?)?([6-9]\d{9})$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_REGEX = /^\d{6}$/;

/**
 * Local calendar YYYY-MM-DD helper (avoids UTC midnight shift).
 */
export function getLocalDateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function validateEmail(raw) {
  const value = (raw || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(value)) {
    return { valid: false, value, error: 'Enter a valid email address.' };
  }
  return { valid: true, value, error: null };
}

export function validateIndianPhone(raw) {
  const cleaned = (raw || '').trim().replace(/\s+/g, '');
  const match = cleaned.match(PHONE_REGEX);
  if (!match) {
    return { valid: false, value: raw, error: 'Enter a valid 10-digit Indian mobile number.' };
  }
  return { valid: true, value: `+91 ${match[1]}`, error: null };
}

export function validateAddressFields(fields) {
  const errors = {};
  const normalizeText = s => (s || '').trim().replace(/\s+/g, ' ');

  const flat = normalizeText(fields.flat_house_no);
  if (flat.length < 3 || flat.length > 120 || !/[a-z0-9]/i.test(flat)) {
    errors.flat_house_no = 'Enter flat/house number and building (min 3 characters).';
  }

  const street = normalizeText(fields.street_locality);
  if (street.length < 4 || street.length > 160 || !/[a-z0-9]/i.test(street)) {
    errors.street_locality = 'Enter street, colony, or locality (min 4 characters).';
  }

  const landmark = normalizeText(fields.landmark);
  if (landmark.length > 120) {
    errors.landmark = 'Landmark must be 120 characters or fewer.';
  }

  const cityRaw = normalizeText(fields.city);
  const cityNormalized = SERVICEABLE_CITIES[cityRaw.toLowerCase()];
  if (!cityNormalized) {
    errors.city = 'Delivery is currently available in Bhubaneswar and nearby areas.';
  }

  const stateRaw = normalizeText(fields.state);
  const stateNormalized = SERVICEABLE_STATES[stateRaw.toLowerCase()];
  if (!stateNormalized) {
    errors.state = 'Delivery is currently available only in Odisha.';
  }

  const pincode = (fields.pincode || '').trim();
  const localityName = getPincodeLocality(pincode);
  if (!PIN_REGEX.test(pincode)) {
    errors.pincode = 'Enter a valid 6-digit PIN code.';
  } else if (!localityName) {
    errors.pincode = `PIN ${pincode} is outside our Bhubaneswar delivery zone (751001–751032 & nearby areas).`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    localityName,
    normalized: {
      flat_house_no: flat,
      street_locality: street,
      landmark: landmark || null,
      city: cityNormalized || cityRaw,
      state: stateNormalized || stateRaw,
      pincode
    }
  };
}

export function validateDeliveryDate(dateStr) {
  const raw = (dateStr || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { valid: false, error: 'Select a valid delivery date.' };
  }
  const minDate = getLocalDateStr(1);
  const maxDate = getLocalDateStr(90);
  if (raw < minDate) {
    return { valid: false, error: 'Delivery must be scheduled at least 1 day in advance.' };
  }
  if (raw > maxDate) {
    return { valid: false, error: 'Delivery can be scheduled up to 90 days ahead.' };
  }
  return { valid: true, error: null };
}

export function clearFieldErrors(formEl) {
  if (!formEl) return;
  formEl.querySelectorAll('.wb-field-error').forEach(el => el.remove());
  formEl.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
}

export function setFieldErrors(formEl, fieldIdToMsg) {
  if (!formEl) return;
  clearFieldErrors(formEl);
  let firstInvalid = null;

  Object.entries(fieldIdToMsg).forEach(([inputId, msg]) => {
    if (!msg) return;
    const input = formEl.querySelector(`#${inputId}`);
    if (!input) return;
    input.setAttribute('aria-invalid', 'true');
    if (!firstInvalid) firstInvalid = input;

    const msgEl = document.createElement('p');
    msgEl.className = 'wb-field-error';
    msgEl.textContent = msg;
    input.insertAdjacentElement('afterend', msgEl);
  });

  if (firstInvalid) firstInvalid.focus();
}
