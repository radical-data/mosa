import { deployWebsite } from "./lib/website-deploy";

async function main() {
  const webhook = process.env.COOLIFY_DEPLOY_WEBHOOK;
  const token = process.env.COOLIFY_API_TOKEN;
  const productionURL = process.env.PRODUCTION_URL;
  const commit = process.env.GITHUB_SHA;
  if (!webhook || !token || !productionURL || !commit)
    throw Error("Set COOLIFY_DEPLOY_WEBHOOK, COOLIFY_API_TOKEN, PRODUCTION_URL and GITHUB_SHA");
  const collection = await deployWebsite({ webhook, token, productionURL, commit });
  console.log(`Verified website at ${commit}: ${collection.records.length} public records`);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
