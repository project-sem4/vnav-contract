import { ethers, hardhatArguments } from "hardhat";
import * as Config from "./config";

async function main() {
  await Config.initConfig();
  const network = hardhatArguments.network
    ? hardhatArguments.network
    : "bsctest";
  const [deployer] = await ethers.getSigners();
  console.log("deploy from address: ", deployer.address);

  const BOToken = await ethers.getContractFactory("BoToken");
  const botoken = await BOToken.deploy();

  const BO = await ethers.getContractFactory("BOContract");
  const bo = await BO.deploy(botoken.address);



  console.log("BOToken address: ", botoken.address);
  console.log("BO address: ", bo.address);

  Config.setConfig(network + ".BoToken", botoken.address);
  Config.setConfig(network + ".BO", bo.address);

  await Config.updateConfig();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
