require("dotenv").config();
const { Agent } = require("./agent");

async function main() {
  const agent = new Agent();
  // TODO: Replace with actual user input
  await agent.run("Test the login functionality.");
}

main().catch(console.error);
