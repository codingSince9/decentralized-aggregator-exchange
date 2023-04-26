// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "./FullyLiquidDex.sol";
import "./NotSoLiquidDex.sol";

contract DexAggregator {
    string public name = "Decentralized Exchange Aggregator";
    FullyLiquidDecentralizedExchange public FullyLiquidDex;
    NotSoLiquidDecentralizedExchange public NotSoLiquidDex;

    constructor(address _fullyLiquidDex, address _notSoLiquidDex) {
        FullyLiquidDex = FullyLiquidDecentralizedExchange(_fullyLiquidDex);
        NotSoLiquidDex = NotSoLiquidDecentralizedExchange(_notSoLiquidDex);
    }

    function executeSwaps(
        bool[] memory isLiquid,
        address[] memory tokenSold,
        address[] memory tokenBought,
        uint256[] memory amountSold
    ) public {
        address liquidDex = address(FullyLiquidDex);
        address notSoLiquidDex = address(NotSoLiquidDex);
        for (uint i = 0; i < isLiquid.length; i++) {
            if (isLiquid[i]) {
                IERC20(tokenSold[i]).approve(liquidDex, amountSold[i]);
                FullyLiquidDex.swap(
                    tokenSold[i],
                    tokenBought[i],
                    amountSold[i]
                );
            } else {
                IERC20(tokenSold[i]).approve(notSoLiquidDex, amountSold[i]);
                NotSoLiquidDex.swap(
                    tokenSold[i],
                    tokenBought[i],
                    amountSold[i]
                );
            }
            if (i == isLiquid.length - 1) {
                uint256 liquidDexAllowance = IERC20(tokenBought[i]).allowance(
                    liquidDex,
                    address(this)
                );
                uint256 notSoLiquidDexAllowance = IERC20(tokenBought[i])
                    .allowance(notSoLiquidDex, address(this));
                if (liquidDexAllowance > 0) {
                    IERC20(tokenBought[i]).transferFrom(
                        liquidDex,
                        msg.sender,
                        liquidDexAllowance
                    );
                }
                if (notSoLiquidDexAllowance > 0) {
                    IERC20(tokenBought[i]).transferFrom(
                        notSoLiquidDex,
                        msg.sender,
                        notSoLiquidDexAllowance
                    );
                }
            }
        }
    }
}
