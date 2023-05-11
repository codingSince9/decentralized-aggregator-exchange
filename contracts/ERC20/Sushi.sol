// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Sushi is ERC20 {
    constructor() ERC20("Sushi Swap Token", "SUSHI") {
        _mint(msg.sender, 30000000000 * 10 ** decimals());
    }
}
