import hre from "hardhat";
import {
	addPaymasterStake,
  addWhitelistAddress,
  deployPaymaster,
} from "../deploy/deploy-gasless-contract";

async function main() {
  //await deployPaymasterContract();

  // await addWhitelistAddress(
  //   "0xa8a0B28AbC58290EF91Dd4375Ea5e1274dE16f47",
  //   "0xFb2C72d3ffe10Ef7c9960272859a23D24db9e04A"
  // );

  await addPaymasterStake("0xa8a0B28AbC58290EF91Dd4375Ea5e1274dE16f47", "1");
}

const deployPaymasterContract = async () => {
  const entrypoint = process.env.ENTRYPOINT;
  if (entrypoint == null) {
    throw new Error("process.env.ENTRYPOINT is null");
  }
  await deployPaymaster(entrypoint);
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
