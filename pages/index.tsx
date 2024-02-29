import { ConnectWallet, toEther, toWei, useAddress, useBalance, useContract, useContractRead, useContractWrite, useSDK, useTokenBalance } from "@thirdweb-dev/react";
import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import { useEffect, useState } from "react";
import SwapInput from "../components/SwapInput";

const Home: NextPage = () => {

  const TOKEN_CONTRACT = "0x098D029b79B54353ff5b2978917395eb50916ab5";
  const DEX_CONTRACT = "0xC75bD95a8B6bcFbB5b6D61d11b94Aa95F98137E8";

  const sdk = useSDK();
  const address = useAddress();

  const { contract: tokenContract } = useContract(TOKEN_CONTRACT);
  const { contract: dexContract } = useContract(DEX_CONTRACT);

  const { data: symbol } = useContractRead(tokenContract, "symbol");
  const { data: tokenBalance } = useTokenBalance(tokenContract, address);

  const { data: nativeBalance } = useBalance();
  const { data: contractTokenBalance } = useTokenBalance(tokenContract, DEX_CONTRACT);

  const [contractBalance, setContractBalance] = useState<String>("0.0");
  const [nativeValue, setNativeValue] = useState<String>("0.0");
  const [tokenValue, setTokenValue] = useState<String>("0.0");
  const [currentForm, setCurrentForm] = useState<String>("native");
  const [isLoading, setIsLoading] = useState<Boolean>(false);

  const { mutateAsync: swapNativeToToken } = useContractWrite(
    dexContract,
    "swapEthTotoken"
  );
  const { mutateAsync: swapTokenToNative } = useContractWrite(
    dexContract,
    "swapTokenToEth"
  );
  const { mutateAsync: approveTokenSpending } = useContractWrite(
    tokenContract,
    "approve"
  );

  const { data: amountToGet } = useContractRead(
    dexContract,
    "getAmountOfTokens",
    currentForm === "native"
      ? [
          toWei(nativeValue as string || "0"),
          toWei(contractBalance as string || "0"),
          contractTokenBalance?.value,
        ]
      : [
        toWei(tokenValue as string || "0"),
        contractTokenBalance?.value,
        toWei(contractBalance as string || "0"),
      ]
  );

  const fetchContractBalance = async () => {
    try {
      const balance = await sdk?.getBalance(DEX_CONTRACT);
      setContractBalance(balance?.displayValue || "0");
    } catch (err) {
      console.error(err);
    }
  };

  const executeSwap = async () => {
    setIsLoading(true);
    try {
      if(currentForm === "native") {
        await swapNativeToToken({
          overrides: {
            value: toWei(nativeValue as string || "0")
          }
        });
        alert("Swap executed successfully!");
      } else {
        await approveTokenSpending({
          args: [
            DEX_CONTRACT,
            toWei(tokenValue as string || "0")
          ]
        });
        await swapTokenToNative({
          args: [
            toWei(tokenValue as string || "0")
          ]
        });
        alert("Swap executed successfully!");
      }
      setNativeValue("0.0");
      setTokenValue("0.0");
    } catch (error) {
      console.log(error);
      alert("An error occured while trying to execute the swap!");
      setNativeValue("0.0");
      setTokenValue("0.0");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContractBalance();
    setInterval(fetchContractBalance, 10000);
  }, []);
  
  useEffect(() => {
    if(!amountToGet) return;
    if(currentForm === "native") {
      setTokenValue(toEther(amountToGet))
    } else {
      setNativeValue(toEther(amountToGet))
    }
  }, [amountToGet]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div style={{ 
          padding: ".5em",
          borderRadius: "10px",
          border: "2px solid #202127",
          minWidth: "360px",
          marginTop: "-45%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <div style={{
            display: "flex",
            flexDirection: currentForm === "native" ? "column" : "column-reverse",
            alignItems: "center",
            justifyContent: "center",
            margin: "0px",
          }}>
            <SwapInput
              current={currentForm as string}
              type="native"
              max={nativeBalance?.displayValue}
              value={nativeValue as string}
              setValue={setNativeValue}
              tokenSymbol="MATIC"
              tokenBalance={nativeBalance?.displayValue}
              
            />

            <button
              onClick={() => 
                currentForm === "native"
                  ? setCurrentForm("token")
                  : setCurrentForm("native")
              }
              className={styles.toggleButton}
            ><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.75006 4.49908L11.0304 3.96875L14.0304 6.96875L12.9697 8.02941L11.2501 6.30974L11.2501 13.4991H9.75006L9.75006 4.49908Z" fill="#F8F8F8"/>
            <path d="M8.25006 13.4992L6.96973 14.0295L3.96973 11.0295L5.03039 9.96882L6.75006 11.6885V4.49915L8.25006 4.49915V13.4992Z" fill="#F8F8F8"/>
            </svg></button>

            <SwapInput 
              current={currentForm as string}
              type="token"
              max={tokenBalance?.displayValue}
              value={tokenValue as string}
              setValue={setTokenValue}
              tokenSymbol={symbol as string}
              tokenBalance={tokenBalance?.displayValue}
            />
          </div>
          {address ? (
            <div style={{textAlign: "center"}}>
              <button
                onClick={executeSwap}
                disabled={isLoading as boolean}
                className={styles.swapButton}
              >{
                isLoading
                  ? "Loading..."
                  : "Swap"
                }</button>
            </div>
          ) : (
            <p style={{textAlign:"center"}}>Connect a wallet to exchange</p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Home;