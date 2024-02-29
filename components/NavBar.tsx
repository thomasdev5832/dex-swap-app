import { ConnectWallet } from "@thirdweb-dev/react";
import React from "react";

export default function Navbar() {
  return (
    <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        margin: ".5em 1em",
    }}>
        <h1 className="title">SWAPDEX</h1>
        <ConnectWallet />
    </div>
  );
}