export function isPersonalAccessToken(token: string) {
  return /^xa?apt/i.test(token.trim());
}
