const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  console.log("Network:", network.name, "- Chain ID:", network.chainId);

  // Contract parameters
  const name = "EtchNFT";
  const symbol = "ETCH";
  const platformFeeRecipient = deployer.address; // You can change this to a different address

  // Deploy the contract
  console.log("\nDeploying EtchNFT contract...");
  const EtchNFT = await ethers.getContractFactory("EtchNFT");
  const etchNFT = await EtchNFT.deploy(name, symbol, platformFeeRecipient);

  await etchNFT.deployed();

  console.log("EtchNFT deployed to:", etchNFT.address);
  console.log("Platform fee recipient:", platformFeeRecipient);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    contractAddress: etchNFT.address,
    deployer: deployer.address,
    platformFeeRecipient: platformFeeRecipient,
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    transactionHash: etchNFT.deployTransaction.hash,
    gasUsed: (await etchNFT.deployTransaction.wait()).gasUsed.toString(),
    contractArgs: [name, symbol, platformFeeRecipient],
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-${network.chainId}.json`,
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Wait for a few block confirmations before verification
  if (network.chainId !== 31337) {
    // Skip for local hardhat network
    console.log("\nWaiting for block confirmations...");
    await etchNFT.deployTransaction.wait(5);

    // Verify the contract
    try {
      console.log("\nVerifying contract on Etherscan...");
      await run("verify:verify", {
        address: etchNFT.address,
        constructorArguments: [name, symbol, platformFeeRecipient],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Test basic functionality
  console.log("\nTesting basic contract functionality...");

  // Check initial state
  const totalOrders = await etchNFT.getTotalOrders();
  const totalTokens = await etchNFT.getTotalTokens();
  const platformFee = await etchNFT.platformFeePercentage();

  console.log("Initial total orders:", totalOrders.toString());
  console.log("Initial total tokens:", totalTokens.toString());
  console.log(
    "Platform fee percentage:",
    platformFee.toString(),
    "basis points",
  );

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update the contract address in your frontend");
  console.log("2. Add fulfillment operators if needed");
  console.log("3. Set up monitoring for the contract");
  console.log("4. Test the contract with small amounts first");

  return {
    contractAddress: etchNFT.address,
    deploymentInfo,
  };
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then((result) => {
    console.log("\nDeployment result:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
