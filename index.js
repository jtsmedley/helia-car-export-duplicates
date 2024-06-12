import path from "node:path";
import {Readable} from "node:stream";
import {createWriteStream} from "node:fs";
import { car } from "@helia/car";
import { createHeliaHTTP } from "@helia/http";
import { mfs } from '@helia/mfs'
import { CarWriter } from "@ipld/car";
import {CID} from "multiformats";

const heliaHTTP = await createHeliaHTTP();
const heliaMfs = mfs(heliaHTTP)
const heliaCar = car(heliaHTTP);

async function run() {
    // Create Base Directory(s)
    await heliaMfs.mkdir('/testDups')
    await heliaMfs.mkdir('/testDups/sub')

    // Use Helia HTTP for Copying Files and MFS to Add Duplicates
    const sourceImageCID = CID.parse("QmNcCxonoEvng8385RZvPp5JmFUjPcVAYG2NWsmff1efNH");
    await heliaMfs.cp(sourceImageCID, '/testDups/image.jpg')
    await heliaMfs.cp(sourceImageCID, '/testDups/sub/image.jpg')

    // Get Root CID
    const rootObject = await heliaMfs.stat("/testDups/"),
        rootCid = rootObject.cid;

    // Save CAR to Disk
    console.info(`Exporting CAR to Disk`);
    const carStoragePath = path.resolve(".", `${rootCid}.car`);
    console.info(`CAR Storage Path: ${carStoragePath}`);
    const { writer, out } = await CarWriter.create(rootCid);
    Readable.from(out).pipe(createWriteStream(carStoragePath));
    await heliaCar.export(rootCid, writer);
    console.info(`Exported CAR to Disk [${carStoragePath}]`);
}

await run();