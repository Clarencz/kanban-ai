export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Mock auth: the server auto-signs every request as a fixed dev user,
// so there is no real login flow. Returning "/" keeps any stray callers harmless.
export const getLoginUrl = () => "/";
