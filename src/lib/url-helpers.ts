export function createDaoSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-"); // Replace multiple hyphens with single hyphen
}

export function getDaoUrl(name: string): string {
  return `/daos/${createDaoSlug(name)}`;
}
