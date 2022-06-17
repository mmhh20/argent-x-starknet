import { BigNumber } from "ethers"
import { number } from "starknet"

import {
  convertTokenAmountToCurrencyValue,
  lookupTokenPriceDetails,
  prettifyCurrencyValue,
  sumTokenBalancesToCurrencyValue,
} from "../src/shared/tokenPrice.service"
import { TokenDetailsWithBalance } from "../src/ui/features/accountTokens/tokens.state"
import mockApiPricesData from "./__mocks__/argent-api-prices.mock.json"
import mockApiTokenData from "./__mocks__/argent-api-tokens.mock.json"
import mockTokensWithBalanceRaw from "./__mocks__/tokens-with-balance.mock.json"

/** convert to expected types - a mix of BN and BigNumber */
export const mockTokensWithBalance = mockTokensWithBalanceRaw.map((token) => {
  return {
    ...token,
    decimals: number.toBN(token.decimals),
    balance: BigNumber.from(token.balance),
  }
})

describe("convertTokenAmountToCurrencyValue()", () => {
  test("should convert token balance to currency value correctly", () => {
    expect(
      /** decimals may be of type BN in the wild */
      convertTokenAmountToCurrencyValue({
        amount: "1000000000000000000",
        decimals: number.toBN(18, 10),
        unitCurrencyValue: 1.23,
      }),
    ).toEqual("1.23")
    expect(
      convertTokenAmountToCurrencyValue({
        amount: "1000000000000000000",
        decimals: 18,
        unitCurrencyValue: "1032.296954",
      }),
    ).toEqual("1032.296954")
    expect(
      convertTokenAmountToCurrencyValue({
        amount: "20000000000000",
        decimals: 13,
        unitCurrencyValue: "1032.296954",
      }),
    ).toEqual("2064.593908")
    /** In pure JS this would lose precision - 1032.296954 * 3 = 3096.8908619999997 */
    expect(
      convertTokenAmountToCurrencyValue({
        amount: "30000000000",
        decimals: 10,
        unitCurrencyValue: "1032.296954",
      }),
    ).toEqual("3096.890862")
  })
})

describe("lookupTokenPriceDetails()", () => {
  test("should find token price details in API response", () => {
    const token = mockTokensWithBalance[0] as TokenDetailsWithBalance
    const price = lookupTokenPriceDetails({
      token,
      pricesData: mockApiPricesData,
      tokenData: mockApiTokenData,
    })
    expect(price).toEqual({
      ccyDayChange: -0.008568,
      ccyValue: 1032.296954,
      ethDayChange: 0,
      ethValue: 1,
      pricingId: 1,
    })
    expect(
      convertTokenAmountToCurrencyValue({
        amount: token.balance || 0,
        decimals: token.decimals || 0,
        unitCurrencyValue: price?.ccyValue || 0,
      }),
    ).toEqual("1032.296954")
  })
})

describe("sumTokenBalancesToCurrencyValue()", () => {
  test("should sum an array of tokens to currency value", () => {
    const result = sumTokenBalancesToCurrencyValue({
      tokens: mockTokensWithBalance,
      pricesData: mockApiPricesData,
      tokenData: mockApiTokenData,
    })
    expect(result).toEqual("1034.298086444706")
  })
})

describe("prettifyCurrencyValue()", () => {
  describe("when valid", () => {
    test("should return pretty currency value", () => {
      expect(prettifyCurrencyValue(0)).toEqual("$0.00")
      expect(prettifyCurrencyValue("0")).toEqual("$0.00")
      expect(prettifyCurrencyValue("1.23456")).toEqual("$1.23")
    })
    test("should round as expected", () => {
      expect(prettifyCurrencyValue("1.504")).toEqual("$1.50")
      expect(prettifyCurrencyValue("1.505")).toEqual("$1.51")
    })
  })
  describe("when invalid", () => {
    test("should return null", () => {
      expect(prettifyCurrencyValue()).toBeNull()
    })
  })
})
