// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Usdc is ERC20 {
    constructor() ERC20("StableCoin Usdc", "USDC") {
        _mint(msg.sender, 3000000000 * 10 ** decimals());
    }
}
