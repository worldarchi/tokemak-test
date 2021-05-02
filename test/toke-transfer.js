// import { expect, use } from "chai";
const {expect} = require("chai");

const { send, expectRevert } = require("@openzeppelin/test-helpers");
const BigNumber = require("bignumber.js");
const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
BigNumber.config({DECIMAL_PLACES: 0});

const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
const usdt = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const wethWhale = "0xda988ebb26f505246c59ba26514340b634f9a7a2";
const daiWhale = "0xb527a981e1d415af696936b3174f2d7ac8d11369";
const usdtWhale = "0xc7807e24338b41a34d849492920f2b9d0e4de2cd";

const ContractProxy = artifacts.require("ContractProxy");
const ContractLogic = artifacts.require("ContractLogic");

async function impersonates(targetAccounts){
  console.log("Impersonating...");
  for(i = 0; i < targetAccounts.length ; i++){
    console.log(targetAccounts[i]);
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [
        targetAccounts[i]
      ]
    });
  }
}

function assertBNGt(a, b){
  let _a = new BigNumber(a);
  let _b = new BigNumber(b);
  let msg = _a.toFixed() + " is not greater than " + _b.toFixed();
  assert.equal(_a.gt(_b), true, msg);
}

describe("Toke transfer test", function() {
  let accounts, underlying, underlyingWhale, whaleBalance, recipentBalance, governance, recipent, contractProxy, contractLogic;
  const transferAmount = "10" + "000000000000000000";

  async function setupExternalContracts(_underlying, _underlyingWhale) {
    underlying = await IERC20.at(_underlying);
    underlyingWhale = _underlyingWhale;

    whaleBalance = await underlying.balanceOf(underlyingWhale);
    console.log('whaleBalance:', whaleBalance.toString());
    assertBNGt(whaleBalance, 0);
  }

  async function setupBalance() {
    let etherGiver = accounts[9];
    await send.ether(etherGiver, underlyingWhale, "10" + "000000000000000000");
  }

  before(async function () {
    accounts = await web3.eth.getAccounts();
    governance = accounts[0];
    recipent = accounts[1];

    contractLogic = await ContractLogic.new({from: governance});
    console.log('contract logic created at', contractLogic.address);
    contractProxy = await ContractProxy.new(contractLogic.address, {from: governance});
    console.log('contract proxy created at', contractProxy.address);
  });

  describe("Toke transfer pass", function () {
    it("Transfer weth to recipent", async function () {
      await setupExternalContracts(weth, wethWhale);
      await setupBalance();
      await impersonates([underlyingWhale]);
      let recipentOldBalance = new BigNumber(await underlying.balanceOf(recipent));

      await contractProxy.addToken(underlying.address, {from: governance});
      await underlying.approve(contractProxy.address, transferAmount, {from: underlyingWhale});
      await contractProxy.transfer(underlying.address, recipent, transferAmount, {from: underlyingWhale});

      let recipentNewBalance = new BigNumber(await underlying.balanceOf(recipent));

      assertBNGt(recipentNewBalance, recipentOldBalance);
    })

    it("Transfer dai to recipent", async function () {
      await setupExternalContracts(dai, daiWhale);
      await setupBalance();
      await impersonates([underlyingWhale]);
      let recipentOldBalance = new BigNumber(await underlying.balanceOf(recipent));

      await contractProxy.addToken(underlying.address, {from: governance});
      await underlying.approve(contractProxy.address, transferAmount, {from: underlyingWhale});
      await contractProxy.transfer(underlying.address, recipent, transferAmount, {from: underlyingWhale});

      let recipentNewBalance = new BigNumber(await underlying.balanceOf(recipent));

      assertBNGt(recipentNewBalance, recipentOldBalance);
    })

    it("Transfer unlisted token usdt, revert", async function () {
      await setupExternalContracts(usdt, usdtWhale);
      await setupBalance();
      await impersonates([underlyingWhale]);

      await underlying.approve(contractProxy.address, transferAmount, {from: underlyingWhale});

      await expectRevert(contractProxy.transfer(underlying.address, recipent, transferAmount, {from: underlyingWhale}), "token is not listed");
    })

    it("Transfer unlisted token usdt with removeToken, revert", async function () {
      await contractProxy.addToken(underlying.address, {from: governance});
      await contractProxy.removeToken(underlying.address, {from: governance});
      await expectRevert(contractProxy.transfer(underlying.address, recipent, transferAmount, {from: underlyingWhale}), "token is not listed");
    })
  })
})