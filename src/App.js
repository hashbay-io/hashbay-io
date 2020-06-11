import React from 'react';
import Web3 from 'web3';

import HashBayAbi from './abi/HashBay.json';
import HomePage from './pages/home';
import './App.css';

let web3, contracts;

function App() {


	// 请求 Metamask 授权
	if(typeof window.ethereum !== 'undefined') {
		window.ethereum.enable();
	}

  // 初始化
  web3 = new Web3(Web3.givenProvider);

  contracts = {
    HashBay: new web3.eth.Contract(HashBayAbi, "0x4986a9b27b62090222b2474b391fb6cf18538705"),
  };

  const props = {
    web3,
    contracts,
  };

  return (
    <div className="App">
      <HomePage {...props} />
    </div>
  );
}

export default App;
