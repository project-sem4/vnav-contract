import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import * as chai from "chai";
import { expect } from "chai";
const chaiAsPromised = require("chai-as-promised");
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

chai.use(chaiAsPromised);

describe("BoToken", async () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress,
    bob: SignerWithAddress;
  let boToken: Contract;

  // Total supply values
  const totalSupply = BigNumber.from(10).pow(18).mul(100000000000); // 100 billion with 18 decimals

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    console.log("owner address = ", owner.address);
    console.log("alice address = ", alice.address);

    const BoToken = await ethers.getContractFactory("BoToken", owner);
    boToken = await BoToken.deploy();
    await boToken.deployed();
  });

  it("should have correct name, symbol, and decimals", async () => {
    expect(await boToken.name()).to.equal("BoToken");
    expect(await boToken.symbol()).to.equal("BOT");
    expect(await boToken.decimals()).to.equal(18);
  });

  it("should mint total supply to deployer", async () => {
    const ownerBalance = await boToken.balanceOf(owner.address);
    expect(ownerBalance).to.equal(totalSupply);

    // Check total supply matches expected value
    expect(await boToken.totalSupply()).to.equal(totalSupply);
  });

  it("should allow owner to transfer tokens", async () => {
    const transferAmount = ethers.utils.parseEther("1000"); // 1000 tokens

    // Initial balances
    const initialOwnerBalance = await boToken.balanceOf(owner.address);
    const initialAliceBalance = await boToken.balanceOf(alice.address);

    // Transfer tokens from owner to Alice
    await boToken.transfer(alice.address, transferAmount);

    // Final balances
    const finalOwnerBalance = await boToken.balanceOf(owner.address);
    const finalAliceBalance = await boToken.balanceOf(alice.address);

    // Verify balances changed correctly
    expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(transferAmount));
    expect(finalAliceBalance).to.equal(initialAliceBalance.add(transferAmount));
  });

  it("should allow approved spender to transfer tokens", async () => {
    const approveAmount = ethers.utils.parseEther("5000"); // 5000 tokens
    const transferAmount = ethers.utils.parseEther("2500"); // 2500 tokens

    // Approve Bob to spend owner's tokens
    await boToken.approve(bob.address, approveAmount);

    // Check allowance
    expect(await boToken.allowance(owner.address, bob.address)).to.equal(approveAmount);

    // Initial balances
    const initialOwnerBalance = await boToken.balanceOf(owner.address);
    const initialAliceBalance = await boToken.balanceOf(alice.address);

    // Bob transfers tokens from owner to Alice
    await boToken.connect(bob).transferFrom(owner.address, alice.address, transferAmount);

    // Final balances
    const finalOwnerBalance = await boToken.balanceOf(owner.address);
    const finalAliceBalance = await boToken.balanceOf(alice.address);

    // Verify balances changed correctly
    expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(transferAmount));
    expect(finalAliceBalance).to.equal(initialAliceBalance.add(transferAmount));

    // Verify allowance was reduced
    expect(await boToken.allowance(owner.address, bob.address)).to.equal(approveAmount.sub(transferAmount));
  });

  it("should prevent transferring more than balance", async () => {
    const excessiveAmount = totalSupply.add(1);

    await expect(
      boToken.transfer(alice.address, excessiveAmount)
    ).to.be.reverted;
  });

  it("should prevent spending more than allowance", async () => {
    const approveAmount = ethers.utils.parseEther("1000");
    const excessiveAmount = approveAmount.add(1);

    // Approve Bob to spend owner's tokens
    await boToken.approve(bob.address, approveAmount);

    await expect(
      boToken.connect(bob).transferFrom(owner.address, alice.address, excessiveAmount)
    ).to.be.reverted;
  });
});