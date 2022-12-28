import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'

const DEFAULT_UNSTACKED_DELAY_SEC = 86400
const DEFAULT_PAYMASTER_STAKE = ethers.utils.parseEther('1')

export const deployEntryPoint = async function (gwFullNodeAddress: string, paymasterStakeInEth?: string, unstackedDelaySec?: number) {
  const [admin] = await ethers.getSigners()
  const paymasterStake: BigNumber = paymasterStakeInEth ? ethers.utils.parseEther(paymasterStakeInEth) : DEFAULT_PAYMASTER_STAKE
  const unstackedDelSec: number = unstackedDelaySec ?? DEFAULT_UNSTACKED_DELAY_SEC

  const Contract = await ethers.getContractFactory('GaslessEntryPoint')
  const contract = await Contract.connect(admin).deploy(gwFullNodeAddress, paymasterStake, unstackedDelSec)
  await contract.deployed()

  console.log('==Entrypoint addr=', contract.address)
}

export const deployPaymaster = async function (entrypointAddress: string) {
  const [admin] = await ethers.getSigners()

  const Contract = await ethers.getContractFactory('GaslessDemoPaymaster')
  const contract = await Contract.connect(admin).deploy(entrypointAddress)
  await contract.deployed()

  console.log('==Paymaster addr=', contract.address)
}

export const addPaymasterStake = async function (paymasterAddr: string, ethAmount: string) {
  const [admin] = await ethers.getSigners()
  const Contract = await ethers.getContractFactory('GaslessDemoPaymaster')
  const contract = await Contract.attach(paymasterAddr)
  const tx = await contract.connect(admin).addStake(99999999, { value: ethers.utils.parseEther(ethAmount) })
  console.log('addPaymasterStake tx sent: ', tx.hash)
  const receipt = await tx.wait()
  console.log('tx receipt: ', receipt)
}

export const depositPaymasterStake = async function (entrypointAddr: string, paymasterAddr: string, ethAmount: string) {
  const [admin] = await ethers.getSigners()
  const Contract = await ethers.getContractFactory('GaslessEntryPoint')
  const contract = await Contract.attach(entrypointAddr)
  const tx = await contract.connect(admin).depositTo(paymasterAddr, { value: ethers.utils.parseEther(ethAmount) })
  console.log('depositPaymasterStake tx sent: ', tx.hash)
  const receipt = await tx.wait()
  console.log('tx receipt: ', receipt)
}

export const getBalance = async function (entrypointAddr: string, paymasterAddr: string) {
  const Contract = await ethers.getContractFactory('GaslessEntryPoint')
  const contract = await Contract.attach(entrypointAddr)
  const balance = await contract.balanceOf(paymasterAddr)
  console.log('paymaster balance: ', balance)
}

export const addWhitelistAddress = async function (paymasterAddr: string, whitelistAddress: string) {
  const [admin] = await ethers.getSigners()
  const Contract = await ethers.getContractFactory('GaslessDemoPaymaster')
  const contract = await Contract.attach(paymasterAddr)
  const tx = await contract.connect(admin).addWhitelistAddress(whitelistAddress)
  console.log('addWhitelistAddress tx sent: ', tx.hash)
  const receipt = await tx.wait()
  console.log('tx receipt: ', receipt)
}
