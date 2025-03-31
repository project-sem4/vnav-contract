import { BigNumber } from "@ethersproject/bignumber";
import { Contract } from "@ethersproject/contracts";
import * as chai from "chai";
import { expect } from "chai";
const chaiAsPromised = require("chai-as-promised");
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

chai.use(chaiAsPromised);

describe("BOContract", async () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress,
    bob: SignerWithAddress,
    carol: SignerWithAddress;
  let boToken: Contract;
  let boContract: Contract;

  // Amount values for testing
  const initialMint = ethers.utils.parseEther("1000000000"); // 1 billion tokens
  const depositAmount = ethers.utils.parseEther("1000");
  const rewardAmount = ethers.utils.parseEther("100");

  beforeEach(async () => {
    [owner, alice, bob, carol] = await ethers.getSigners();

    // Deploy BoToken
    const BoToken = await ethers.getContractFactory("BoToken", owner);
    boToken = await BoToken.deploy();
    await boToken.deployed();

    // Deploy BOContract
    const BOContract = await ethers.getContractFactory("BOContract", owner);
    boContract = await BOContract.deploy(boToken.address);
    await boContract.deployed();

    // Transfer some tokens to Alice and Bob for testing
    await boToken.transfer(alice.address, ethers.utils.parseEther("10000"));
    await boToken.transfer(bob.address, ethers.utils.parseEther("10000"));

    // Approve the BOContract to spend Alice's and Bob's tokens
    await boToken.connect(alice).approve(boContract.address, ethers.utils.parseEther("5000"));
    await boToken.connect(bob).approve(boContract.address, ethers.utils.parseEther("5000"));
  });

  it("should be correctly initialized with token address", async () => {
    expect(await boContract.boToken()).to.equal(boToken.address);
    expect(await boContract.owner()).to.equal(owner.address);
  });

  it("should allow users to deposit tokens", async () => {
    // Get initial balances
    const initialAliceBalance = await boToken.balanceOf(alice.address);
    const initialContractBalance = await boToken.balanceOf(boContract.address);

    // Alice deposits tokens
    await boContract.connect(alice).deposit(depositAmount);

    // Check final balances
    const finalAliceBalance = await boToken.balanceOf(alice.address);
    const finalContractBalance = await boToken.balanceOf(boContract.address);

    expect(finalAliceBalance).to.equal(initialAliceBalance.sub(depositAmount));
    expect(finalContractBalance).to.equal(initialContractBalance.add(depositAmount));
  });

  it("should prevent deposits of zero tokens", async () => {
    await expect(
      boContract.connect(alice).deposit(0)
    ).to.be.revertedWith("Amount must be greater than 0");
  });

  it("should allow owner to distribute rewards", async () => {
    // First, Alice deposits tokens
    await boContract.connect(alice).deposit(depositAmount);

    // Get initial balances
    const initialCarolBalance = await boToken.balanceOf(carol.address);
    const initialContractBalance = await boToken.balanceOf(boContract.address);

    // Owner distributes rewards to Carol
    await boContract.connect(owner).distributeReward(carol.address, rewardAmount);

    // Check final balances
    const finalCarolBalance = await boToken.balanceOf(carol.address);
    const finalContractBalance = await boToken.balanceOf(boContract.address);

    expect(finalCarolBalance).to.equal(initialCarolBalance.add(rewardAmount));
    expect(finalContractBalance).to.equal(initialContractBalance.sub(rewardAmount));
  });

  it("should prevent non-owners from distributing rewards", async () => {
    // Alice deposits tokens
    await boContract.connect(alice).deposit(depositAmount);

    // Bob tries to distribute rewards (should fail)
    await expect(
      boContract.connect(bob).distributeReward(carol.address, rewardAmount)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should allow owner to withdraw all tokens", async () => {
    // Both Alice and Bob deposit tokens
    await boContract.connect(alice).deposit(depositAmount);
    await boContract.connect(bob).deposit(depositAmount);

    const totalDepositAmount = depositAmount.mul(2);

    // Get initial balances
    const initialOwnerBalance = await boToken.balanceOf(owner.address);
    const initialContractBalance = await boToken.balanceOf(boContract.address);

    // Owner withdraws all tokens
    await boContract.connect(owner).withdrawTokens();

    // Check final balances
    const finalOwnerBalance = await boToken.balanceOf(owner.address);
    const finalContractBalance = await boToken.balanceOf(boContract.address);

    expect(finalOwnerBalance).to.equal(initialOwnerBalance.add(initialContractBalance));
    expect(finalContractBalance).to.equal(0);
  });

  it("should prevent non-owners from withdrawing tokens", async () => {
    // Alice deposits tokens
    await boContract.connect(alice).deposit(depositAmount);

    // Alice tries to withdraw tokens (should fail)
    await expect(
      boContract.connect(alice).withdrawTokens()
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should prevent withdrawing when contract has no tokens", async () => {
    // Try to withdraw without any deposits
    await expect(
      boContract.connect(owner).withdrawTokens()
    ).to.be.revertedWith("No tokens to withdraw");
  });

  it("should return correct contract balance", async () => {
    // Alice deposits tokens
    await boContract.connect(alice).deposit(depositAmount);

    // Check contract balance
    expect(await boContract.getContractBalance()).to.equal(depositAmount);

    // Bob deposits tokens
    await boContract.connect(bob).deposit(depositAmount);

    // Check updated contract balance
    expect(await boContract.getContractBalance()).to.equal(depositAmount.mul(2));
  });
});