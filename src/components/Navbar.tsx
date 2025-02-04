import { chain } from "@/app/chain";
import { client } from "@/app/client";
import { USDC_TOKEN_ADDRESS } from "@/constants/contracts";
import { base } from "thirdweb/chains";
import { ConnectButton } from "thirdweb/react";

export function Navbar() {
  return (
    // <nav className="navbar bg-base-100">
    //   <h1 className="text-2xl font-bold">Decisive a(utomatio)n DCA</h1>
    //   <div className="items-center flex gap-2">
    //     <ConnectButton
    //       client={client}
    //       chain={chain}
    //       detailsButton={{
    //         displayBalanceToken: {
    //           [base.id]: USDC_TOKEN_ADDRESS,
    //         },
    //       }}
    //     />
    //   </div>
    // </nav>
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <h1 className="text-xl font-bold">Decisive a(utomatio)n DCA</h1>
      </div>

      <div className="navbar-end">
        <ConnectButton
          client={client}
          chain={chain}
          detailsButton={{
            displayBalanceToken: {
              [base.id]: USDC_TOKEN_ADDRESS,
            },
          }}
        />
      </div>
    </div>
  );
}
