import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  GaslessEntryPoint,
  GaslessDemoPaymaster,
  GaslessDemoPaymaster__factory,
  DummyContract,
} from '../typechain'
import {
  deployGaslessEntryPoint
} from './testutils'
import { hexConcat, parseEther } from 'ethers/lib/utils'
import { UserOperationStruct } from '../typechain/contracts/core/GaslessEntryPoint'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

describe('EntryPoint with VerifyingPaymaster', function () {
  let entryPoint: GaslessEntryPoint
  let paymaster: GaslessDemoPaymaster
  let dummyContract: DummyContract
  let whitelistUser: SignerWithAddress; 
  let invalidUser: SignerWithAddress;
  
  beforeEach(async function () {
    const [admin, _whitelistUser, _invalidUser, fullnode] = await ethers.getSigners();
    whitelistUser = _whitelistUser 
    invalidUser = _invalidUser

    const DummyContract = await ethers.getContractFactory("DummyContract")
    dummyContract = await DummyContract.deploy()
    console.log(`Deploy dummy contract: ${dummyContract.address}`)

    entryPoint = await deployGaslessEntryPoint(fullnode.address, 1, 1)

    console.log(`User in whitelist: ${whitelistUser.address}`)
    console.log(`User not in whitelist: ${invalidUser.address}`)

    paymaster = await new GaslessDemoPaymaster__factory(admin).deploy(entryPoint.address)
    console.log(`Paymaster: ${paymaster.address}`)
    await paymaster.addStake(99999999, { value: parseEther('2') })
    await paymaster.addWhitelistAddress(whitelistUser.address)
    await entryPoint.depositTo(paymaster.address, { value: parseEther('1') })
  })
    // DummyContract.test(1, 1)
    const callData = "0x4dd3b30b00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001"
  describe('#validatePaymasterUserOp', () => {
    it('whitelist valid handleOp', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData,
          callGasLimit: 10000,
          verificationGasLimit: 1000000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }

      // init state
      const initSum = await dummyContract.sum()
      expect(initSum).to.equal(1)
      
      // Send tx with a valid user.
      const tx = await entryPoint.connect(whitelistUser).handleOp(userOp, {gasLimit: 100000, gasPrice: 0})
      await tx.wait()

      // check state changed
      const sum = await dummyContract.sum()
      expect(sum).to.equal(2) 
      
    })

    it('whitelist valid with fallback', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
        callContract: dummyContract.address,
        callData,
        callGasLimit: 10000,
        verificationGasLimit: 1000000,
        maxFeePerGas: 1,
        maxPriorityFeePerGas: 1,
        paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }

      // init state
      const initSum = await dummyContract.sum()
      expect(initSum).to.equal(1)

      // Send tx with a valid user without function selector(which should use fallback).
      const pTx = await entryPoint.connect(whitelistUser).populateTransaction.handleOp(userOp, {gasLimit: 100000, gasPrice: 0})
      // remove the function selector to use fallback
      const gaslessPayloadBytes = "0x" + pTx.data?.slice(10);
      const tx = {...pTx, ...{data: gaslessPayloadBytes}};
      console.log(`send gasless tx without function selector, transaction =>`, tx);
      const txResponse = await entryPoint.connect(whitelistUser).signer.sendTransaction(tx);
      await txResponse.wait()
      // check state changed
      const sum = await dummyContract.sum()
      expect(sum).to.equal(2) 
      
    })

    it('whitelist valid with plain tx', async () => {
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData,
          callGasLimit: 10000,
          verificationGasLimit: 1000000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }

      // init state
      const initSum = await dummyContract.sum()
      expect(initSum).to.equal(1)
      
      // construct plain tx
      const abiCoder = new ethers.utils.AbiCoder();
      const payload = abiCoder.encode(["tuple(address callContract, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData) UserOperation"], [userOp])

      const plainTx = {
        from: whitelistUser.address,
        to: entryPoint.address,
        data: payload,
        gasPrice: 0,
        gasLimit: 1000000,
        value: 0,
      }
      const signer = entryPoint.connect(whitelistUser).signer;
      const tx = await signer.sendTransaction(plainTx);
      await tx.wait()

      // check state changed
      const sum = await dummyContract.sum()
      expect(sum).to.equal(2) 
    })
    
    it('invalid user', async () => {
      
      // Mock UserOp
      const userOp: UserOperationStruct = {
          callContract: dummyContract.address,
          callData,
          callGasLimit: 10000,
          verificationGasLimit: 1000000,
          maxFeePerGas: 1,
          maxPriorityFeePerGas: 1,
          paymasterAndData: hexConcat([paymaster.address, "0x1234"])
      }
      
      // Send tx with a invalid user.
      await expect(entryPoint.connect(invalidUser).handleOp(userOp, {gasLimit: 100000, gasPrice: 0}))
        .to.be.revertedWith(`FailedOp("${paymaster.address}", "Verifying user in whitelist.")`)
    })
  })
})
