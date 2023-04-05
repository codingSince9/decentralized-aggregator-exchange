// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "../../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Matic is ERC20 {
    constructor() ERC20("Polygon Network Token", "MATIC") {
        _mint(msg.sender, 20000000 * 10 ** decimals());
    }
}
