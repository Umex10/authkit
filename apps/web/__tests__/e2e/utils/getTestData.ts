/**
 * Creates deterministic auth credentials for Playwright runs.
 *
 * The optional `uniqueIdentifier` lets specs reserve separate users — e.g.
 * auth.spec.ts passes "unique" so it reuses exactly the account that the shared
 * auth.setup.ts provisions beforehand (to trigger duplicate-account paths).
 */
export const getTestData = (browserName: string, uniqueIdentifier: string) => {
  const uniqueId = `${browserName}`;
  const uniqueLength = browserName.toLowerCase() === "webkit" ? 4 : 5;
  const unique = uniqueLength.toString() + uniqueIdentifier.length;
  return {
    name: browserName,
    email: `${uniqueId}@${uniqueIdentifier}.com`,
    phone: `+4312345${unique}6789${unique}`,
    password: "testKey123",
  };
};
