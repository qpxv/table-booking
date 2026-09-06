/** Everything after the first `:` in a component custom_id (e.g. the id it carries). */
export function idFromCustomId(customId: string | undefined): string {
  if (!customId) return "";
  const colon = customId.indexOf(":");
  return colon === -1 ? "" : customId.slice(colon + 1);
}
