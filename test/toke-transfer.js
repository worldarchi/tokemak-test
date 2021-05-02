// import { expect, use } from "chai";
const {expect} = require("chai");

const { send, expectRevert } = require("@openzeppelin/test-helpers");
const BigNumber = require("bignumber.js");
const IERC20 = artifacts.require("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20");
BigNumber.config({DECIMAL_PLACES: 0});

const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const dai = "0x6b175474e89094c44da98b954eedeac495271d0f";
const yfi = "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e";
const wethWhale = "0xda988ebb26f505246c59ba26514340b634f9a7a2";
const daiWhale = "0xb527a981e1d415af696936b3174f2d7ac8d11369";
const yfiWhale = "0xbcd5000f5c522856e710c5d274bb672b2f2eefbf";

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
    await send.ether(etherGiver, underlyingWhale, "1" + "000000000000000000");
    await underlying.transfer(contractProxy.address, transferAmount, {from: underlyingWhale});
  }

  before(async function () {
    accounts = await web3.eth.getAccounts();
    governance = accounts[0];
    recipent = accounts[1];

    contractLogic = await ContractLogic.new({from: governance});
    contractProxy = await ContractProxy.new(contractLogic.address, {from: governance});
  });

  describe("Toke transfer pass", function () {
    it("Transfer weth to recipent", async function () {
      await setupExternalContracts(weth, wethWhale);
      await impersonates([underlyingWhale]);
      await setupBalance();
      let recipentOldBalance = new BigNumber(await underlying.balanceOf(recipent));

      await contractProxy.addToken(underlying.address, {from: governance});
      await contractProxy.transfer(underlying.address, recipent, transferAmount, {from: governance});

      let recipentNewBalance = new BigNumber(await underlying.balanceOf(recipent));

      assertBNGt(recipentNewBalance, recipentOldBalance);
    })

    it("Transfer dai to recipent", async function () {
      await setupExternalContracts(dai, daiWhale);
      await impersonates([underlyingWhale]);
      await setupBalance();
      let recipentOldBalance = new BigNumber(await underlying.balanceOf(recipent));

      await contractProxy.addToken(underlying.address, {from: governance});
      await contractProxy.transfer(underlying.address, recipent, transferAmount, {from: governance});

      let recipentNewBalance = new BigNumber(await underlying.balanceOf(recipent));

      assertBNGt(recipentNewBalance, recipentOldBalance);
    })

    it("Transfer unlisted token yfi, revert", async function () {
      await setupExternalContracts(yfi, yfiWhale);
      await impersonates([underlyingWhale]);
      await setupBalance();

      await expectRevert(contractProxy.transfer(underlying.address, recipent, transferAmount, {from: governance}), "token is not listed");
    })

    it("Transfer unlisted token yfi with removeToken, revert", async function () {
      await contractProxy.addToken(underlying.address, {from: governance});
      await contractProxy.removeToken(underlying.address, {from: governance});
      await expectRevert(contractProxy.transfer(underlying.address, recipent, transferAmount, {from: governance}), "token is not listed");
    })
  })
})