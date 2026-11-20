export function randomString(length = 21): string {
  return Array.from({ length }, () => {
    const value = Math.floor(Math.random() * 256) & 63;

    return value < 36
      ? value.toString(36)
      : value < 62
        ? (value - 26).toString(36).toUpperCase()
        : value > 62 ? "-" : "_";
  }).join("");
}