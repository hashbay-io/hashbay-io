import React from 'react';

import styles from './styles.module.css';

let timer;

class HomePage extends React.PureComponent {

  state = {
    account: '',
    contractName: '',

    balance: '',
    symbol: '',

    start: '',
    end: '',

    reward: '',
  }

  componentDidMount() {
    this.initPageData();

    const { ethereum } = window;
    const { account } = this.state;
    if (ethereum) {
      ethereum.on('accountsChanged', (accounts) => {
        if (accounts[0] !== account) {
          this.setState({
            account: accounts[0],
          });
          // 重新初始化页面数据
          this.initPageData();
        }
      });
    }
  }

  initPageData = () => {
    this.getAccount();
    this.getContractName();
    this.getSymbol();
    this.getDate();
  }


  pageListen = (account) => {
    clearInterval(timer);
    // 定时轮询区块高度
    timer = setInterval(() => {
      this.getReward(account);
    }, 15 * 1000);
  }

  // 获取当前账户
  getAccount = async () => {
    const { web3 } = this.props;
    // 获取账户
		let accounts = await web3.eth.getAccounts();
		if(accounts.length <= 0) {
			console.log('未检测到账户');
			return;
		}
    const account = accounts[0];
    this.getBalance(account);
    this.getReward(account);
    this.setState({
      account,
    }, () => {
      this.pageListen(account);
    });
  }

  // 获取合约名称
  getContractName = async () => {
    const { contracts } = this.props;
    contracts['HashBay'].methods.contractName().call().then((contractName) => {
      this.setState({
        contractName,
      });
    });
  }

  // 获取 mhash 余额
  getBalance = async (account) => {
    const { web3, contracts } = this.props;
    const res = await contracts['HashBay'].methods.balanceOf(account).call();
    this.setState({
      balance: web3.utils.fromWei(res, 'mwei'),
    });
  }

  // 获取代币符号
  getSymbol = async () => {
    const { contracts } = this.props;
    const symbol = await contracts['HashBay'].methods.symbol().call();
    this.setState({
      symbol,
    });
  }

  // 获取合约起止日期
  getDate = async () => {
    const { contracts } = this.props;
    let startDateTime = await contracts['HashBay'].methods.startDate().call();
    let endDateTime = await contracts['HashBay'].methods.endDate().call();
    this.setState({
      start: +startDateTime * 1000,
      end: +endDateTime * 1000,
    });
  }

  // 获取当前收益
  getReward = async (account) => {
    const { contracts } = this.props;
    contracts['HashBay'].methods.myReward().call({
      from: account
    }).then((reward) => {
      this.setState({
        reward,
      });
    });
  }

  // 计算当前时间进度
  getTimeSchedule = () => {
    const { start, end } = this.state;
    if (!start || !end) { return null }
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const nowTime = new Date().getTime();
    const result = +((nowTime - startTime) / (endTime - startTime) * 100).toFixed(2);
    return result;
  }

  // 提现
  handleClickClaim = async () => {
    const { contracts } = this.props;
    const { account } = this.state;
    try {
      contracts['HashBay'].methods.claim().send({
        from: account,
      }).then((res) => {
        this.initPageData();
      });
    } catch (e) {
      console.log(e);
    }
  }

  // 渲染当前用户地址
  renderAccount = () => {
    const { account } = this.state;
    return (
      <div className={styles.account}>
        {`${account.substring(0, 10)}...${account.substring(account.length - 10)}`}
      </div>
    )
  }

  // 格式化渲染日期
  renderTimeFormat = (prefix, timestamp) => {
    if (!timestamp) { return null }
    let date = new Date(timestamp).toString();
    let dateArr = date.split(' ');
    return `${prefix}: ${dateArr[1]} ${dateArr[2]}`;
  }

  render() {

    const { web3 } = this.props;
    const { contractName, start, end, balance, symbol, reward } = this.state;

    const nowLeft = this.getTimeSchedule();

    // 获取当前时间轴偏移位置
    const getTimeListNowLeft = () => {
      // 初始时间不存在时，修正偏移量 5.6%
      if (!start) { return 5.6 }
      // 最小左边偏移 22%，最大右边偏移 80%
      return nowLeft < 22 ? 22 : nowLeft > 80 ? 80 : nowLeft;
    }

    return (
      <div className={styles.home}>
        <header className={styles.header}>
          <img src={require('../../assets/logo_2x.png')} alt="hash bay"/>
          {this.renderAccount()}
        </header>
        <div className={styles.content}>
          {
            contractName ? (
              <span className={styles.node}>
                <span className={styles.success} />
                <span>{contractName}</span>
              </span>
            ) : null
          }
          <h2 className={styles.token}>
            { balance ? `${balance} ${symbol}` : '' }
          </h2>
          <div className={styles.timeline}>
            <span className={styles.start}>
              {this.renderTimeFormat('start', parseInt(new Date(start).getTime(), 10))}
            </span>
            <span
              className={styles.now}
              style={{ left: `${getTimeListNowLeft()}%` }}
            >
              {this.renderTimeFormat('now', parseInt(new Date().getTime(), 10))}
            </span>
            <span className={styles.end}>
              {this.renderTimeFormat('end', parseInt(new Date(end).getTime(), 10))}
            </span>
            <div className={styles.fill} style={{ width: `${nowLeft}%` }}></div>
          </div>
          <h2>{ reward ? `${web3.utils.fromWei(reward, 'ether')} eth` : '' }</h2>
          <div className={styles.btns}>
            <button
              onClick={this.handleClickClaim}
              disabled={+reward === 0}
            >
              CLAIM
            </button>
          </div>
        </div>
        <div className={styles.qa}>
          <ul>
            <li>
              <p className={styles.qa__q}>What will happen if I do the <strong>CLAIM</strong>?</p>
              <p className={styles.qa__a}>You will get the cumulative ether.</p>
            </li>
            <li>
              <p className={styles.qa__q}>What will happen if I do the TRANSFER?</p>
              <p className={styles.qa__a}>You will give the right of mining to the one you give.</p>
            </li>
            <li>
              <p className={styles.qa__q}>Will I lose my cumulative ether when I transfer my MHASH token?</p>
              <p className={styles.qa__a}>NO. You will keep your cumulative ether. But you will lose the right to earn the
future mining benefits.</p>
            </li>
          </ul>
        </div>
      </div>
    )
  }

}

export default HomePage;
