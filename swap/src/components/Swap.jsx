import React, { useEffect, useState } from "react";
import { Input, Modal, Popover, Radio, message } from "antd";
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import { ethers } from "ethers";
import { useSendTransaction, useWaitForTransaction } from "wagmi";

function Swap(props) {
  const { address, isConnected } = props;
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState(tokenList[0]);
  const [tokenTwo, setTokenTwo] = useState(tokenList[1]);
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [prices, setPrices] = useState(null);
  const [txDetails, setTxDetails] = useState({
    to: null,
    data: null,
    value: null,
  });

  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetails.to),
      data: String(txDetails.data),
      value: String(txDetails.value),
    }
  });

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  function handleSlippageChange(e) {
    setSlippage(e.target.value);
  }

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(2));
    } else {
      setTokenTwoAmount(null);
    }
  }

  function switchTokens() {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    const one = tokenOne;
    const two = tokenTwo;
    setTokenOne(two);
    setTokenTwo(one);
    fetchPrices(two.address, one.address);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
  }

  function modifyToken(i) {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);
    if (changeToken === 1) {
      setTokenOne(tokenList[i]);
      fetchPrices(tokenList[i].address, tokenTwo.address);
    } else {
      setTokenTwo(tokenList[i]);
      fetchPrices(tokenTwo.address, tokenList[i].address);
    }
    setIsOpen(false);
  }

  async function fetchPrices(one, two) {
    try {
    const res = await axios.get(`https://token-swap-dapp.onrender.com/tokenPrice`, {
      params: { addressOne: one, addressTwo: two },
    });
    setPrices(res.data);
  } catch (error) {
    console.error("Error fetching prices:", error.response?.data || error.message);
      messageApi.open({
        type: "error",
        content: "Failed to fetch token prices.",
      });
    }
  }


  async function fetchDexSwap() {
    if (!isConnected) {
      alert("Please connect your wallet.");
      return;
    }

    try {
      isLoading(true); // Show a loading spinner or similar indicator
      const allowance = await axios.get(`https://token-swap-dapp.onrender.com/api/1inch-allowance`, {
        params: { tokenAddress: tokenOne.address, walletAddress: address },
      });

      if (allowance.data.allowance === "0") {
        const approve = await axios.get(`https://token-swap-dapp.onrender.com/api/1inch-approve-transaction`, {
          params: { tokenAddress: tokenOne.address },
        });
        setTxDetails(approve.data);
        alert("Approval transaction ready to send.");
        isLoading(false);
        return;
      }

      const tx = await axios.get(`https://token-swap-dapp.onrender.com/api/1inch-swap`, {
        params: {
          fromTokenAddress: tokenOne.address,
          toTokenAddress: tokenTwo.address,
          amount: tokenOneAmount.padEnd(tokenOne.decimals + tokenOneAmount.length, '0'),
          fromAddress: address,
          slippage: slippage,
        },
      });

      const decimals = Number(`1e${tokenTwo.decimals}`);
      setTokenTwoAmount((Number(tx.data.toTokenAmount) / decimals).toFixed(2));
      setTxDetails(tx.data.tx);
      isLoading(false);
    } catch (error) {
      console.error("Error fetching Dex swap data:", error.response?.data || error.message);
      alert("Error: " + (error.response?.data?.message || error.message));
      isLoading(false);
    }
  }

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address);
  }, []);

  useEffect(() => {
    if (txDetails.to && txDetails.data && txDetails.value && isConnected) {
      sendTransaction();
    }
  }, [txDetails, isConnected]);

useEffect(()=>{
  messageApi.destroy();

  if(isLoading){
    messageApi.open({
      type:'loading',
      content:'transaction is pending...',
      duration: 0,
    })
  }
}, [isLoading])

  useEffect(() =>{
    messageApi.destroy();
    if(isSuccess){
      messageApi.open({
        type: 'success',
        content: 'Transaction successful!',
      });

    }else if(txDetails.to){
      messageApi.open({
        type:'error',
        content:'Transaction failed',
        duration:1.50,
      })
    }
  }, [isSuccess])

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
    <>
      {contextHolder}
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList.map((e, i) => (
            <div
              className="tokenChoice"
              key={i}
              onClick={() => modifyToken(i)}
            >
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenTicker">{e.ticker}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={changeAmount}
            disabled={!prices}
          />
          <Input placeholder="0" value={tokenTwoAmount} disabled />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="assetOneLogo" className="assetLogo" />
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="assetTwoLogo" className="assetLogo" />
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>
        <div
          className="swapButton"
          disabled={!tokenOneAmount || !isConnected}
          onClick={fetchDexSwap}
        >
          Swap
        </div>
      </div>
    </>
  );
}

export default Swap;
