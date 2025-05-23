import { getSpectraInfo } from "../src/portfolio-tracker/spectra";
import { getEulerInfo } from "../src/portfolio-tracker/euler";
import { getMagpieInfo } from "../src/portfolio-tracker/magpie";
import { getAddress } from "ethers";
import { getShadowInfo } from "../src/portfolio-tracker/shadow";
import { getSiloInfo } from "../src/portfolio-tracker/silo";
import { getSwapXInfo } from "../src/portfolio-tracker/swapx";
import { getPendleInfo } from "../src/portfolio-tracker/pendle";
import {getVFatInfo} from "../src/portfolio-tracker/vfat";

const functionMap: Record<string, (wallet: string) => Promise<any>> = {
  spectra: getSpectraInfo,
  euler: getEulerInfo,
  magpie: getMagpieInfo,
  shadow: getShadowInfo,
  silo: getSiloInfo,
  swapx: getSwapXInfo,
  pendle: getPendleInfo,
  vfat: getVFatInfo
};

// Change here
const selectedFunction = process.argv[2] || 'euler';
const walletAddress = getAddress("0x4E430992Db6F3BdDbC6A50d1513845f087E9af4A");
//

(async () => {
  try {
    const targetFunction = functionMap[selectedFunction.toLowerCase()];

    if (!targetFunction) {
      throw new Error(`Invalid function name "${selectedFunction}". Choose from: ${Object.keys(functionMap).join(", ")}`);
    }

    const result = await targetFunction(walletAddress);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`Error running ${selectedFunction}:`, error);
  }
})();
