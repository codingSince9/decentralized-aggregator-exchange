// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "./FullyLiquidDex.sol";
import "./NotSoLiquidDex.sol";

contract DexAggregator {
    string public name = "Decentralized Exchange Aggregator";
    FullyLiquidDecentralizedExchange FullyLiquidDex;
    NotSoLiquidDecentralizedExchange NotSoLiquidDex;

    constructor(
        address _link,
        address _matic,
        address _sushi,
        address _usdc,
        address _wbtc
    ) {
        FullyLiquidDex = new FullyLiquidDecentralizedExchange(
            _link,
            _matic,
            _sushi,
            _usdc,
            _wbtc
        );
        NotSoLiquidDex = new NotSoLiquidDecentralizedExchange(
            _link,
            _matic,
            _sushi,
            _usdc,
            _wbtc
        );
    }

    function callContracts() public returns (uint, string memory) {
        (bool successA, bytes memory resultA) = address(FullyLiquidDex).call(
            abi.encodeWithSignature("swap()")
        );
        require(successA, "ContractA function call failed");

        (bool successB, bytes memory resultB) = address(NotSoLiquidDex).call(
            abi.encodeWithSignature("swap()")
        );
        require(successB, "ContractB function call failed");

        uint result1 = abi.decode(resultA, (uint));
        string memory result2 = abi.decode(resultB, (string));

        return (result1, result2);
    }
}
