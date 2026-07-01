const LOGIN_TIMESTAMP_KEY = "user_login_timestamp";
const EXPIRY_DAYS = 7;

export function saveLoginTimestamp() {
  const now = Date.now();
  localStorage.setItem(LOGIN_TIMESTAMP_KEY, String(now));
}

export function checkLoginExpired(): boolean {
  const timestamp = localStorage.getItem(LOGIN_TIMESTAMP_KEY);
  if (!timestamp) return false; // tidak ada data login

  const elapsed = Date.now() - parseInt(timestamp, 10);
  const maxAge = EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 hari dalam ms

  return elapsed > maxAge;
}

export function clearLoginTimestamp() {
  localStorage.removeItem(LOGIN_TIMESTAMP_KEY);
}