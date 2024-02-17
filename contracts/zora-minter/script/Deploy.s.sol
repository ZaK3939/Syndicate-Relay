// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import { console2 } from "forge-std/console2.sol";

import { ZoraMinter } from "../src/ZoraMinter.sol";
import { BaseScript } from "./Base.s.sol";

contract Deploy is BaseScript {
    address deployer;
    address internal referrer = address(0x6D83cac25CfaCdC7035Bed947B92b64e6a8B8090);
    address internal signer = address(0xD892F010cc6B13dF6BBF1f5699bd7cDF1ec23595);
    address internal collection = address(0xd12175C64D479e9e3d09B9B29889A36C0942bD4d);
    // address internal minter = address(0xFF8B0f870ff56870Dc5aBd6cB3E6E89c8ba2e062);
    address internal minter = address(0x5037e7747fAa78fc0ECF8DFC526DcD19f73076ce);

     function setUp() public virtual {
        string memory mnemonic = vm.envString("MNEMONIC");
        (deployer,) = deriveRememberKey(mnemonic, 0);
        console2.log("Deployer: %s", deployer);
    }

    function run() public broadcast {
        new ZoraMinter{ salt: unicode"🏝️" }(deployer, referrer, signer, collection, minter);
    }
}
