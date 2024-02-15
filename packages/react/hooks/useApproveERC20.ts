import { AccountInterface, BigNumberish, Contract } from "starknet";

import {
  approveERC20 as approveERC20Core,
  Config,
  increaseERC20
} from "@ark-project/core";

import { useConfig } from "./useConfig";

export type ApproveERC20Parameters = {
  starknetAccount: AccountInterface;
  startAmount: BigNumberish;
  currencyAddress?: BigNumberish;
};

export default function useApproveERC20() {
  const config = useConfig();

  async function getAllowance(
    starknetAccount: AccountInterface,
    start_amount: BigNumberish,
    currency_address: BigNumberish
  ) {
    if (!currency_address) {
      throw new Error("no currency address.");
    }
    const compressedContract = await config?.starknetProvider.getClassAt(
      currency_address.toString()
    );
    if (compressedContract?.abi === undefined) {
      throw new Error("no abi.");
    }

    const tokenContract = new Contract(
      compressedContract?.abi,
      currency_address.toString(),
      config?.starknetProvider
    );

    const allowance = await tokenContract.allowance(
      starknetAccount.address,
      config?.starknetContracts.executor
    );

    return allowance;
  }

  async function approveERC20(parameters: ApproveERC20Parameters) {
    if (!parameters.currencyAddress) {
      throw new Error(
        "No currency address. Please set currency_address to approveERC20."
      );
    }

    const allowance = await getAllowance(
      parameters.starknetAccount,
      parameters.startAmount,
      parameters.currencyAddress
    );

    if (allowance.gte(parameters.startAmount)) {
      return;
    } else if (allowance.eq(0)) {
      await approveERC20Core(config as Config, {
        starknetAccount: parameters.starknetAccount,
        contractAddress: parameters.currencyAddress.toString(),
        amount: parameters.startAmount
      });
    } else {
      await increaseERC20(config as Config, {
        starknetAccount: parameters.starknetAccount,
        contractAddress: parameters.currencyAddress.toString(),
        amount: parameters.startAmount
      });
    }
  }
  return { approveERC20 };
}
