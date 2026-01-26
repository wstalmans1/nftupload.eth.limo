import { ethers, upgrades } from "hardhat";

async function main() {
  const NFTUpload = await ethers.getContractFactory("NFTUpload");
  const proxy = await upgrades.deployProxy(NFTUpload, ["nftupload", "nftu"], {
    kind: "uups"
  });

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log(`Proxy deployed to: ${proxyAddress}`);
  console.log(`Implementation deployed to: ${implAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
