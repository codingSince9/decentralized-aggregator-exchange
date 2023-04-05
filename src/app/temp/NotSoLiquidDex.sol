// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.17;

import "./Link.sol";
import "./Matic.sol";
import "./Sushi.sol";
import "./Usdc.sol";
import "./Wbtc.sol";

interface IToken {
    function transfer(address _to, uint256 _value) external returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool);

    function approve(address _spender, uint256 _value) external returns (bool);

    function balanceOf(address _owner) external view returns (uint256);
}

contract NotSoLiquidDecentralizedExchange {
    string public name = "Not So Liquid Decentralized Exchange";
    Link public link;
    Matic public matic;
    Sushi public sushi;
    Usdc public usdc;
    Wbtc public wbtc;

    address public owner;
    mapping(address => mapping(address => uint256)) public reserves;
    mapping(address => IToken) public tokens;
    // mapping for supported tokens
    mapping(address => bool) public supportedTokens;

    event TokenPurchase(
        address indexed buyer,
        address indexed tokenSold,
        address indexed tokenBought,
        uint256 amountSold,
        uint256 amountBought
    );
    event TokenSale(
        address indexed seller,
        address indexed tokenSold,
        address indexed tokenBought,
        uint256 amountSold,
        uint256 amountBought
    );

    constructor(
        Link _link,
        Matic _matic,
        Sushi _sushi,
        Usdc _usdc,
        Wbtc _wbtc
    ) {
        owner = msg.sender;
        supportedTokens[address(_link)] = true;
        supportedTokens[address(_matic)] = true;
        supportedTokens[address(_sushi)] = true;
        supportedTokens[address(_usdc)] = true;
        supportedTokens[address(_wbtc)] = true;

        link = _link;
        matic = _matic;
        sushi = _sushi;
        usdc = _usdc;
        wbtc = _wbtc;

        IToken linkToken = IToken(address(link));
        IToken maticToken = IToken(address(matic));
        IToken sushiToken = IToken(address(sushi));
        IToken usdcToken = IToken(address(usdc));
        IToken wbtcToken = IToken(address(wbtc));

        tokens[address(matic)] = maticToken;
        tokens[address(link)] = linkToken;
        tokens[address(sushi)] = sushiToken;
        tokens[address(usdc)] = usdcToken;
        tokens[address(wbtc)] = wbtcToken;

        reserves[address(this)][address(usdc)] = 970 ether;
        reserves[address(usdc)][address(this)] = 1700000000000000000000000;
        // x * y = k
        // x (eth) = 970
        // y (usdc) = 1 700 000
        // k (constant product) = 1 649 000 000
        // price per ETH = 1752,58

        reserves[address(link)][address(usdc)] = 70000000000000000000000;
        reserves[address(usdc)][address(link)] = 500000000000000000000000;
        // x (link) = 70 000
        // y (usdc) = 500 000
        // k (constant product) = 35 000 000 000
        // price per ETH = 7,14

        reserves[address(matic)][address(usdc)] = 90000000000000000000000;
        reserves[address(usdc)][address(matic)] = 100000000000000000000000;
        // x (matic) = 90 000
        // y (usdc) = 100 000
        // k (constant product) = 9 000 000 000
        // price per ETH = 1,11

        reserves[address(sushi)][address(usdc)] = 95000000000000000000000;
        reserves[address(usdc)][address(sushi)] = 100000000000000000000000;
        // x (sushi) = 95 000
        // y (usdc) = 100 000
        // k (constant product) = 9 500 000 000
        // price per ETH = 1,15

        reserves[address(wbtc)][address(usdc)] = 3550000000000000000000;
        reserves[address(usdc)][address(wbtc)] = 100000000000000000000000000;
        // x (wbtc) = 355
        // y (usdc) = 10 000 000
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

    function buy(address tokenSold, address tokenBought) public payable {
        require(
            supportedTokens[tokenSold] && supportedTokens[tokenBought],
            "Invalid token pair"
        );
        uint256 amountSold = msg.value;
        uint256 amountBought = getAmountOut(tokenSold, tokenBought, amountSold);
        require(amountBought > 0, "Not enough liquidity in the pool");
        require(
            tokens[tokenBought].transfer(msg.sender, amountBought),
            "Token transfer failed"
        );
        reserves[tokenSold][tokenBought] += amountSold;
        reserves[tokenBought][tokenSold] -= amountBought;
        emit TokenPurchase(
            msg.sender,
            tokenSold,
            tokenBought,
            amountSold,
            amountBought
        );
    }

    function sell(
        address tokenSold,
        address tokenBought,
        uint256 amountSold
    ) public {
        require(
            supportedTokens[tokenSold] && supportedTokens[tokenBought],
            "Invalid token pair"
        );
        uint256 amountBought = getAmountOut(tokenSold, tokenBought, amountSold);
        require(amountBought > 0, "Not enough liquidity in the pool");
        require(
            tokens[tokenSold].transferFrom(
                msg.sender,
                address(this),
                amountSold
            ),
            "Token transfer failed"
        );
        require(
            tokens[tokenBought].transfer(msg.sender, amountBought),
            "Token transfer failed"
        );
        reserves[tokenSold][tokenBought] -= amountSold;
        reserves[tokenBought][tokenSold] += amountBought;
        emit TokenSale(
            msg.sender,
            tokenSold,
            tokenBought,
            amountSold,
            amountBought
        );
    }

    function withdraw(address token) public {
        require(msg.sender == owner, "Only the owner can withdraw");
        require(supportedTokens[token], "Invalid token");
        uint256 balance = tokens[token].balanceOf(address(this));
        require(
            tokens[token].transfer(owner, balance),
            "Token transfer failed"
        );
        reserves[token][address(this)] = 0;
        reserves[address(this)][token] = 0;
    }
}
