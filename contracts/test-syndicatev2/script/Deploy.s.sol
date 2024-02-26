// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import { console2 } from "forge-std/console2.sol";

import { DemoERC1155 } from "../src/DemoERC1155.sol";

import { BaseScript } from "./Base.s.sol";

contract Deploy is BaseScript {
    address deployer;
     function setUp() public virtual {
        string memory mnemonic = vm.envString("MNEMONIC");
        (deployer,) = deriveRememberKey(mnemonic, 0);
        console2.log("Deployer: %s", deployer);
    }

    function run() public broadcast {
        new DemoERC1155(deployer);
    }
}
