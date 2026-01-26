import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("NFTUpload", function () {
  it("mints with tokenURI", async function () {
    const [owner] = await ethers.getSigners();
    const NFTUpload = await ethers.getContractFactory("NFTUpload");
    const proxy = await upgrades.deployProxy(NFTUpload, ["nftupload", "nftu"], {
      kind: "uups"
    });

    await proxy.waitForDeployment();

    const tokenURI = "ipfs://bafybeigdyrztv";
    const tx = await proxy.mint(tokenURI);
    await tx.wait();

    expect(await proxy.ownerOf(1)).to.equal(owner.address);
    expect(await proxy.tokenURI(1)).to.equal(tokenURI);
  });
});
