import { getAddress } from "ethers";
import { getBeetsInfo } from "../src/portfolio-tracker/beets";

(async () => {
  try {
    const wallet = getAddress("0x70709614BF9aD5bBAb18E2244046d48f234a1583") // "0x40369a631aF44aFc5FB3e940f4C6d317a38fDD76") // "0x70709614BF9aD5bBAb18E2244046d48f234a1583")
    const result = await getBeetsInfo(wallet)
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getBeefyInfo:", error);
  }
})();
