import { getAddress } from "ethers";
import {getSiloInfo} from "../src/portfolio-tracker/silo";

(async () => {
  try {
    const wallet = getAddress("0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A");
    const result = await getSiloInfo(wallet)
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error running getSiloInfo:", error);
  }
})();
