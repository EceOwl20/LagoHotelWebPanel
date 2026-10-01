// Read only on the server. The browser cannot select the upstream contract.
export function getAzuraBlogVersion(env = process.env) {
  const value = env.AZURA_BLOG_CONTRACT_VERSION;
  if (value === undefined || value === "2") return 2;
  if (value === "3") return 3;
  throw Object.assign(new Error("AZURA_BLOG_CONTRACT_VERSION yalnız 2 veya 3 olabilir."), {
    status: 503, code: "BLOG_CONTRACT_CONFIGURATION_ERROR",
  });
}
