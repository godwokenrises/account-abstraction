import hre from "hardhat";
import {
	addPaymasterStake,
  addWhitelistAddress,
  deployPaymaster,
  depositPaymasterStake,
  getBalance,
} from "../deploy/deploy-gasless-contract";

async function main() {
  //await deployPaymasterContract();

  // await addWhitelistAddress(
  //   "0xa8a0B28AbC58290EF91Dd4375Ea5e1274dE16f47",
  //   "0x73b72d6EE63e16c898AD18C7f447846BfC3AB1aC"
  // );

  //await addPaymasterStake("0xa8a0B28AbC58290EF91Dd4375Ea5e1274dE16f47", "1000");
  await depositPaymasterStake("0xc52059c8cd8f0817f9e67009e014322f5239547f", "0xa8a0B28AbC58290EF91Dd4375Ea5e1274dE16f47", "1000");
  await getBalance("0xc52059c8cd8f0817f9e67009e014322f5239547f", "0xa8a0B28AbC58290EF91Dd4375Ea5e1274dE16f47")
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
