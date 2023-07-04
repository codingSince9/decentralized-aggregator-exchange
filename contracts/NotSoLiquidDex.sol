// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "./ERC20/Link.sol";
import "./ERC20/Matic.sol";
import "./ERC20/Sushi.sol";
import "./ERC20/Usdc.sol";
import "./ERC20/Wbtc.sol";

import "../node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NotSoLiquidDecentralizedExchange {
    string public name = "Not So Liquid Decentralized Exchange";
    IERC20 public link;
    IERC20 public matic;
    IERC20 public sushi;
    IERC20 public usdc;
    IERC20 public wbtc;

    address public owner;
    mapping(address => mapping(address => uint256)) public reserves;
    mapping(address => IERC20) public tokens;
    // mapping for supported tokens
    mapping(address => bool) public supportedTokens;

    event TokenSwap(
        address indexed tokenSold,
        address indexed tokenBought,
        uint256 amountSold,
        uint256 amountBought
    );

    constructor(
        address _link,
        address _matic,
        address _sushi,
        address _usdc,
        address _wbtc
    ) {
        owner = msg.sender;
        supportedTokens[address(this)] = true;
        supportedTokens[address(_link)] = true;
        supportedTokens[address(_matic)] = true;
        supportedTokens[address(_sushi)] = true;
        supportedTokens[address(_usdc)] = true;
        supportedTokens[address(_wbtc)] = true;

        link = IERC20(_link);
        matic = IERC20(_matic);
        sushi = IERC20(_sushi);
        usdc = IERC20(_usdc);
        wbtc = IERC20(_wbtc);

        tokens[address(matic)] = matic;
        tokens[address(link)] = link;
        tokens[address(sushi)] = sushi;
        tokens[address(usdc)] = usdc;
        tokens[address(wbtc)] = wbtc;

        reserves[address(this)][address(usdc)] = 970 ether;
        reserves[address(usdc)][address(this)] = 1700000000000000000000000;
        // x * y = k
        // x (eth) = 970
        // y (usdc) = 1 700 000
        // k (constant product) = 1 649 000 000
        // price per ETH = 1752,58

        reserves[address(link)][address(usdc)] = 7000000000000000000000;
        reserves[address(usdc)][address(link)] = 50000000000000000000000;
        // x (link) = 7 000
        // y (usdc) = 50 000
        // k (constant product) = 35 000 000 000
        // price per ETH = 7,14

        reserves[address(matic)][address(usdc)] = 9000000000000000000000;
        reserves[address(usdc)][address(matic)] = 10000000000000000000000;
        // x (matic) = 9 000
        // y (usdc) = 10 000
        // k (constant product) = 9 000 000 000
        // price per ETH = 1,11

        reserves[address(sushi)][address(usdc)] = 9500000000000000000000;
        reserves[address(usdc)][address(sushi)] = 10000000000000000000000;
        // x (sushi) = 9 500
        // y (usdc) = 10 000
        // k (constant product) = 9 500 000 000
        // price per ETH = 1,15

        reserves[address(wbtc)][address(usdc)] = 355000000000000000000;
        reserves[address(usdc)][address(wbtc)] = 10000000000000000000000000;
        // x (wbtc) = 35.5
        // y (usdc) = 1 000 000
        // k (constant product) = 3 550 000 000
        // price per ETH = 28 170
    }

    function getAmountOut(
        address tokenSold,
        address tokenBought,
        uint256 amountSold
    ) public view returns (uint256) {
        require(
            supportedTokens[tokenSold] && supportedTokens[tokenBought],
            "Invalid token pair"
        );
        require(
            reserves[tokenSold][tokenBought] > 0 &&
                reserves[tokenBought][tokenSold] > 0,
            "Not enough liquidity in the pool"
        );
        // [ETH][DAI] = 9 700
        // [DAI][ETH] = 17 000 000
        uint256 numerator = reserves[tokenBought][tokenSold] * amountSold;
        uint256 denominator = reserves[tokenSold][tokenBought] + amountSold;
        return numerator / denominator;
    }

    function executeArbitrage(
        address tokenSold,
        address tokenBought,
        uint256 amount0,
        uint256 amount1
    ) public {
        require(
            supportedTokens[tokenSold] && supportedTokens[tokenBought],
            "Invalid token pair"
        );

        reserves[tokenSold][tokenBought] = amount0;
        reserves[tokenBought][tokenSold] = amount1;
    }

    function swap(
        address tokenSold,
        address tokenBought,
        uint256 _amountSold
    ) public payable {
        require(
            supportedTokens[tokenSold] && supportedTokens[tokenBought],
            "Invalid token pair"
        );
        uint256 amountSold = _amountSold;
        uint256 amountBought = getAmountOut(tokenSold, tokenBought, amountSold);
        require(amountBought > 0, "Not enough liquidity in the pool");

        if (tokenBought == address(this)) {
            require(
                IERC20(tokenSold).transferFrom(
                    msg.sender,
                    address(this),
                    amountSold
                ),
                "Token transfer failed"
            );
            payable(msg.sender).transfer(amountBought);
        } else if (tokenSold == address(this)) {
            require(
                IERC20(tokenBought).transfer(msg.sender, amountBought),
                "Token transfer failed"
            );
        } else {
            require(
                IERC20(tokenSold).transferFrom(
                    msg.sender,
                    address(this),
                    amountSold
                ),
                "Token transfer failed"
            );
            require(
                IERC20(tokenBought).approve(msg.sender, amountBought),
                "Token transfer failed"
            );
        }
        reserves[tokenSold][tokenBought] += amountSold;
        reserves[tokenBought][tokenSold] -= amountBought;
        emit TokenSwap(tokenSold, tokenBought, amountSold, amountBought);
    }
}
