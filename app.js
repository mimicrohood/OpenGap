const markets = [
  {
    t:"NVDA", i:"NV", logo:"assets/logos/nvidia.svg", q:"Will NVDA open 3% higher?", p:43,
    last:"$187.62", strike:"$193.25", v:"$284,910", c:"earnings"
  },
  {
    t:"TSLA", i:"TS", logo:"assets/logos/tesla.svg", q:"Will TSLA open above $455?", p:61,
    last:"$448.18", strike:"$455.00", v:"$196,204", c:"weekend"
  },
  {
    t:"SPY", i:"SP", logo:"assets/logos/spy.png", q:"Will SPY open green on Monday?", p:67,
    last:"$652.41", strike:"$652.41", v:"$175,883", c:"weekend"
  },
  {
    t:"AAPL", i:"AP", logo:"assets/logos/apple.svg", q:"Will AAPL gap up after earnings?", p:54,
    last:"$231.74", strike:"$231.74", v:"$148,720", c:"earnings"
  },
  {
    t:"AMD", i:"AM", logo:"assets/logos/amd.svg", q:"Will AMD open above $168?", p:38,
    last:"$164.22", strike:"$168.00", v:"$87,114", c:"earnings"
  },
  {
    t:"META", i:"ME", logo:"assets/logos/meta.svg", q:"Will META gap down?", p:29,
    last:"$744.06", strike:"$744.06", v:"$72,911", c:"weekend"
  }
];
const state = {
  market:markets[0], side:"UP", connected:false, account:null, filter:"all"
};
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function renderMarkets() {
  const visible = markets.filter(m => {
    return state.filter === "all" || m.c === state.filter;
  });
  $("#market-list").innerHTML = visible.map(m => {
    const active = m === state.market ? "active" : "";
    return '<button class="market-row ' + active + '" data-t="' + m.t + '">' +
      '<span class="ticker-icon"><img src="' + m.logo + '" alt="" /></span>' +
      '<span class="market-copy"><b>' + m.t + '</b><small>' +
      m.q + '</small></span><span class="odds"><b>' + m.p +
      'c</b><small>UP</small></span></button>';
  }).join("");
  $$(".market-row").forEach(row => {
    row.onclick = () => selectMarket(row.dataset.t);
  });
}

function selectMarket(ticker) {
  const m = state.market = markets.find(item => item.t === ticker);
  $("#asset").textContent = m.i;
  $("#symbol").textContent = m.t;
  $("#question").textContent = m.q;
  $("#last").textContent = m.last;
  $("#strike").textContent = m.strike;
  $("#volume").textContent = m.v;
  $("#prob").innerHTML = m.p + '% <small>UP</small>';
  $("#up").textContent = m.p + "c";
  $("#down").textContent = (100 - m.p) + "c";
  state.side = "UP";
  $$(".side").forEach(button => {
    button.classList.toggle("active", button.dataset.side === "UP");
  });
  updateOrder();
  renderMarkets();
}

function updateOrder() {
  const amount = Math.max(0, Number($("#amount").value) || 0);
  const p = state.side === "UP" ? state.market.p : 100 - state.market.p;
  $("#avg").textContent = p.toFixed(1) + "c";
  $("#payout").textContent = "$" + (amount / (p / 100)).toFixed(2);
  $("#fee").textContent = "$" + (amount * .005).toFixed(2);
  $("#order b").textContent = "PLACE " + state.side + " ORDER";
  $("#order small").textContent = state.connected ?
    "REVIEW ORDER IN WALLET" : "CONNECT WALLET TO EXECUTE";
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = "> " + message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

const ROBINHOOD_CHAIN = {
  chainId:"0x1237",
  chainName:"Robinhood Chain",
  nativeCurrency:{ name:"Ether", symbol:"ETH", decimals:18 },
  rpcUrls:["https://rpc.mainnet.chain.robinhood.com/"],
  blockExplorerUrls:["https://robinhoodchain.blockscout.com/"]
};

function walletLabel(account) {
  return account.slice(0, 6) + "..." + account.slice(-4);
}

function setWalletState(account, connected) {
  state.account = account || null;
  state.connected = Boolean(account && connected);
  const wallet = $("#wallet");
  wallet.classList.toggle("network-error", Boolean(account && !connected));
  wallet.innerHTML = state.connected
    ? "<b>*</b> " + walletLabel(account)
    : account
      ? "<b>[!]</b> SWITCH NETWORK"
      : "<b>[W]</b> CONNECT WALLET";
  $("#balance").textContent = state.connected ? "--" : "0.00";
  updateOrder();
}

async function ensureRobinhoodChain(provider) {
  const current = await provider.request({ method:"eth_chainId" });
  if (current.toLowerCase() === ROBINHOOD_CHAIN.chainId) return;
  try {
    await provider.request({
      method:"wallet_switchEthereumChain",
      params:[{ chainId:ROBINHOOD_CHAIN.chainId }]
    });
  } catch (error) {
    if (error.code !== 4902) throw error;
    await provider.request({
      method:"wallet_addEthereumChain",
      params:[ROBINHOOD_CHAIN]
    });
  }
}

async function connectWallet() {
  const provider = window.ethereum;
  if (!provider || typeof provider.request !== "function") {
    showToast("NO EVM WALLET FOUND - INSTALL METAMASK OR ROBINHOOD WALLET");
    return false;
  }
  try {
    const accounts = await provider.request({ method:"eth_requestAccounts" });
    if (!accounts.length) return false;
    await ensureRobinhoodChain(provider);
    setWalletState(accounts[0], true);
    showToast("CONNECTED TO ROBINHOOD CHAIN");
    return true;
  } catch (error) {
    setWalletState(state.account, false);
    showToast(error && error.code === 4001
      ? "WALLET REQUEST REJECTED"
      : "ROBINHOOD CHAIN CONNECTION FAILED");
    return false;
  }
}

async function restoreWallet() {
  const provider = window.ethereum;
  if (!provider || typeof provider.request !== "function") return;
  try {
    const accounts = await provider.request({ method:"eth_accounts" });
    if (!accounts.length) {
      setWalletState(null, false);
      return;
    }
    const chainId = await provider.request({ method:"eth_chainId" });
    setWalletState(
      accounts[0],
      chainId.toLowerCase() === ROBINHOOD_CHAIN.chainId
    );
  } catch (_) {
    setWalletState(null, false);
  }
}

if (window.ethereum && typeof window.ethereum.on === "function") {
  window.ethereum.on("accountsChanged", accounts => {
    if (!accounts.length) {
      setWalletState(null, false);
      showToast("WALLET DISCONNECTED");
      return;
    }
    restoreWallet();
  });
  window.ethereum.on("chainChanged", restoreWallet);
}

restoreWallet();
renderMarkets();
updateOrder();
setInterval(() => {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone:"America/New_York",
    hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false
  }).format(new Date());
  $("#clock").textContent = value + " ET";
}, 1000);

let seconds = 49328;
setInterval(() => {
  seconds = seconds > 0 ? seconds - 1 : 50400;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = seconds % 60;
  $("#countdown").textContent = [h,m,s]
    .map(v => String(v).padStart(2,"0")).join(":");
}, 1000);

$$(".tabs button").forEach(button => {
  button.onclick = () => {
    $$(".tabs button").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    state.filter = button.dataset.filter;
    renderMarkets();
  };
});
$$(".side").forEach(button => {
  button.onclick = () => {
    state.side = button.dataset.side;
    $$(".side").forEach(item => {
      item.classList.toggle("active", item === button);
    });
    updateOrder();
  };
});
$("#amount").oninput = updateOrder;
$$(".quick button").forEach(button => {
  button.onclick = () => {
    $("#amount").value =
      (Number($("#amount").value) || 0) + Number(button.dataset.n);
    updateOrder();
  };
});
$("#max").onclick = () => {
  $("#amount").value = state.connected ? 2500 : 0;
  updateOrder();
};
$("#wallet").onclick = connectWallet;
$("#order").onclick = async () => {
  if (!state.connected) {
    const connected = await connectWallet();
    if (!connected) return;
  }
  showToast(state.side + " ORDER READY FOR " + state.market.t);
};
const guide = $("#guide");
$("#how").onclick = () => guide.showModal();
$("#guide > button").onclick = () => guide.close();
guide.onclick = event => {
  if (event.target === guide) guide.close();
};
$("#star").onclick = event => {
  event.target.textContent = event.target.textContent === "*" ? "#" : "*";
  showToast("WATCHLIST UPDATED");
};
